const db=supabase.createClient(RIF.URL,RIF.KEY),B="portfolio";
const el=(t,p={},k=[])=>{const e=Object.assign(document.createElement(t),p);k.forEach(c=>e.append(c));return e};
const ytid=u=>(u.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/)||[])[1];
const shrink=f=>new Promise(r=>{const i=new Image();i.onload=()=>{const s=Math.min(1,1600/Math.max(i.width,i.height)),c=el("canvas",{width:i.width*s,height:i.height*s});c.getContext("2d").drawImage(i,0,0,c.width,c.height);c.toBlob(r,"image/jpeg",.85)};i.src=URL.createObjectURL(f)});
const isStaffUser=async()=>{const s=(await db.auth.getSession()).data.session;if(!s)return false;try{const {data}=await db.rpc("is_staff");return data===true}catch(_){return false}};
const isAdmin=async()=>{const s=(await db.auth.getSession()).data.session;return !!s&&(s.user.email||"").toLowerCase()==="takanashi@rif-studio.com"};
const MAXMB=50,isAud=f=>/\.(mp3|wav)$/i.test(f.name)||/^audio\//.test(f.type);
async function addItem(page,file,ytUrl,cap,section){
  const v=ytid(ytUrl||"");if(!file&&!v)throw new Error("유튜브 링크, 사진, 음원 중 하나를 넣어 주세요");
  let row;
  if(file&&isAud(file)){
    if(file.size>MAXMB*1048576)throw new Error("음원은 "+MAXMB+"MB 이하만 올릴 수 있어요 (mp3로 변환하면 용량이 줄어요)");
    const ext=/\.wav$/i.test(file.name)?"wav":"mp3",path=Date.now()+"."+ext;
    const {error}=await db.storage.from(B).upload(path,file,{contentType:ext==="wav"?"audio/wav":"audio/mpeg"});if(error)throw error;
    row={kind:"audio",url:db.storage.from(B).getPublicUrl(path).data.publicUrl,path};
    cap=cap||file.name.replace(/\.[^.]+$/,"");
  }else if(file){const path=Date.now()+".jpg";const {error}=await db.storage.from(B).upload(path,await shrink(file),{contentType:"image/jpeg"});if(error)throw error;
    row={kind:"image",url:db.storage.from(B).getPublicUrl(path).data.publicUrl,path}}
  else row={kind:"youtube",url:v};
  row.page=page;row.caption=cap||null;row.section=section||null;
  const {error}=await db.from("items").insert(row);if(error)throw error}
async function delItem(it){if(it.path)await db.storage.from(B).remove([it.path]);const {error}=await db.from("items").delete().eq("id",it.id);if(error)throw error}
const yt=it=>{const b=el("button",{className:"yt",type:"button",ariaLabel:"영상 재생"},[el("img",{loading:"lazy",alt:"",src:"https://img.youtube.com/vi/"+it.url+"/hqdefault.jpg"}),el("span",{textContent:"▶"})]);
  b.onclick=()=>b.replaceWith(el("iframe",{allow:"autoplay; encrypted-media; picture-in-picture",allowFullscreen:true,src:"https://www.youtube-nocookie.com/embed/"+it.url+"?autoplay=1"}));return b};
const zoom=i=>{i.style.cursor="zoom-in";i.onclick=()=>{const o=el("div",{className:"lb"},[el("img",{src:i.src,alt:i.alt})]);o.onclick=()=>o.remove();document.addEventListener("keydown",function k(e){if(e.key==="Escape"){o.remove();document.removeEventListener("keydown",k)}});document.body.append(o)};return i};
const media=it=>it.kind==="youtube"?yt(it):it.kind==="audio"?el("audio",{controls:true,preload:"none",src:it.url}):zoom(el("img",{loading:"lazy",alt:it.caption||"",src:it.url}));
const OLDCATS=["Bust","Waist-up","Full figure","Miscellaneous"];
const CATS={charmbung:["Premium","Cover","Stem","Vocal"]};
function addForm(getPage,done,extra=[],getSec,getSecs){
  const yt=el("input",{placeholder:"유튜브 링크 붙여넣기"}),file=el("input",{type:"file",accept:"image/*,.mp3,.wav,audio/mpeg,audio/wav"}),cap=el("input",{placeholder:"설명 또는 곡 제목 (선택)"}),sec=el("select",{ariaLabel:"분류"}),nsec=el("input",{placeholder:"새 탭 이름 (예: Sketch)",maxLength:30,hidden:true}),prev=el("div"),msg=el("p",{className:"note"}),btn=el("button",{className:"btn",textContent:"추가"});
  const fill=()=>{const base=CATS[getPage()]||[],ex=(getSecs?getSecs():[]).filter(n=>!base.includes(n)),cur=getSec?getSec():sec.value;
    sec.replaceChildren(...(base.length?[]:[el("option",{value:"",textContent:"탭 · 없음"})]),...[...base,...ex].map(n=>el("option",{value:n,textContent:"탭 · "+n})),el("option",{value:"__new",textContent:"＋ 새 탭 만들기"}));
    sec.hidden=false;sec.value=[...base,...ex].includes(cur)?cur:(base[0]||"");nsec.hidden=true};
  sec.onchange=()=>{nsec.hidden=sec.value!=="__new";if(!nsec.hidden)nsec.focus()};
  yt.oninput=()=>{const v=ytid(yt.value);prev.replaceChildren(...(v?[el("iframe",{src:"https://www.youtube-nocookie.com/embed/"+v})]:[]))};
  btn.onclick=async()=>{msg.textContent=file.files[0]&&file.files[0].size>5e6?"올리는 중… 큰 파일은 1분 넘게 걸릴 수 있어요":"올리는 중…";btn.disabled=true;
    try{const s=sec.value==="__new"?nsec.value.trim():sec.value;if(sec.value==="__new"&&!s)throw new Error("새 탭 이름을 적어 주세요");await addItem(getPage(),file.files[0],yt.value,cap.value.trim(),s);yt.value=file.value=cap.value="";prev.replaceChildren();msg.textContent="";done(s)}
    catch(e){msg.textContent="실패: "+e.message}btn.disabled=false};
  const panel=el("div",{id:"panel"},[...extra,yt,file,cap,sec,nsec,prev,btn,msg]);panel.fill=fill;fill();return panel}

/* 전화번호 자동 서식: 숫자만 입력하면 000-0000-0000 */
const fmtPhone=v=>{const s=String(v==null?"":v);const d=s.replace(/\D/g,"");if(!d)return/^\s*-?\s*$/.test(s)?s.trim():s;const x=d.slice(0,11);return x.length<=3?x:x.length<=7?x.slice(0,3)+"-"+x.slice(3):x.slice(0,3)+"-"+x.slice(3,7)+"-"+x.slice(7)};
const bindPhone=i=>{if(!i)return;i.setAttribute("inputmode","numeric");i.setAttribute("maxlength","13");i.setAttribute("placeholder","000-0000-0000");i.addEventListener("input",()=>{const f=fmtPhone(i.value);if(f!==i.value)i.value=f})};
