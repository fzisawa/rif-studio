/* RIF STUDIO News — 목록 · 글 보기 · (경영지원팀 · 대표) 쓰기/고치기/지우기
   한국어로 쓰면 저장할 때 일본어 · 영어 번역이 자동으로 채워져요(고쳐서 저장할 수도 있어요). */
(async()=>{
const root=document.getElementById("news");if(!root)return;
const T={ko:{notice:"공지",empty:"아직 소식이 없어요.",back:"← 목록",write:"＋ 새 소식 쓰기",edit:"수정",del:"삭제",draft:"비공개",older:"더 보기"},
 ja:{notice:"お知らせ",empty:"まだニュースはありません。",back:"← 一覧へ",write:"＋ 新しいニュース",edit:"編集",del:"削除",draft:"非公開",older:"もっと見る"},
 en:{notice:"Notice",empty:"No news yet.",back:"← All news",write:"＋ New post",edit:"Edit",del:"Delete",draft:"Private",older:"Load more"}};
const lng=()=>{try{const v=localStorage.getItem("rif-lang");if(v==="ja"||v==="en")return v}catch(_){}return "ko"};
let L=lng(),t=T[L],posts=[],staff=false,me=null,shown=20;
const ti=p=>(L==="ja"&&p.title_ja)||(L==="en"&&p.title_en)||p.title,bo=p=>(L==="ja"&&p.body_ja)||(L==="en"&&p.body_en)||p.body||"";
const day=s=>{const d=new Date(s);return d.getFullYear()+"."+String(d.getMonth()+1).padStart(2,"0")+"."+String(d.getDate()).padStart(2,"0")};
/* 본문: 줄바꿈 유지 + 주소는 링크로 */
const rich=s=>{const f=document.createDocumentFragment();String(s||"").split("\n").forEach((line,i)=>{if(i)f.append(el("br"));
  line.split(/(https?:\/\/[^\s<]+)/g).forEach((x,j)=>f.append(j%2?el("a",{href:x,target:"_blank",rel:"noopener",textContent:x}):document.createTextNode(x)))});return f};
const top=el("div",{className:"ntop"}),list=el("ul",{className:"nlist"}),more=el("button",{type:"button",className:"btn ghost nmore",hidden:true}),view=el("article",{className:"npost",hidden:true});
root.replaceChildren(top,list,more,view);
more.onclick=()=>{shown+=20;draw()};
function draw(){
  const id=new URLSearchParams(location.search).get("id"),p=id&&posts.find(x=>x.id===id);
  top.replaceChildren();if(staff){const w=el("button",{type:"button",className:"btn",textContent:t.write});w.onclick=()=>editor(null);top.append(w)}
  if(p){list.hidden=more.hidden=true;view.hidden=false;post(p);return}
  view.hidden=true;list.hidden=false;list.replaceChildren();
  if(!posts.length){list.append(el("li",{className:"nempty",textContent:t.empty}));more.hidden=true;return}
  posts.slice(0,shown).forEach(p=>{const a=el("a",{href:"?id="+p.id},[el("time",{textContent:day(p.created_at),dateTime:p.created_at}),el("span",{className:"nt"},[...(p.pinned?[el("em",{textContent:t.notice})]:[]),...(!p.published?[el("em",{className:"dr",textContent:t.draft})]:[]),document.createTextNode(ti(p))]),...(p.image_url?[el("span",{className:"nimg",ariaHidden:"true"})]:[])]);
    a.onclick=e=>{if(e.metaKey||e.ctrlKey)return;e.preventDefault();history.pushState(null,"","?id="+p.id);draw();scrollTo({top:root.offsetTop-80})};list.append(el("li",{className:p.pinned?"pin":""},[a]))});
  more.hidden=posts.length<=shown;more.textContent=t.older}
function post(p){const back=el("a",{href:"./",className:"nback",textContent:t.back});back.onclick=e=>{e.preventDefault();history.pushState(null,"",location.pathname);draw()};
  view.replaceChildren(back,el("p",{className:"ndate"},[...(p.pinned?[el("em",{textContent:t.notice})]:[]),document.createTextNode(day(p.created_at))]),el("h2",{textContent:ti(p)}),
    ...(p.image_url?[el("img",{className:"nhero",src:p.image_url,alt:""})]:[]),el("div",{className:"nbody"},[rich(bo(p))]));
  if(staff){const e1=el("button",{type:"button",className:"btn small",textContent:t.edit}),d1=el("button",{type:"button",className:"btn small danger",textContent:t.del});
    e1.onclick=()=>editor(p);d1.onclick=async()=>{if(!confirm("'"+p.title+"' 소식을 삭제할까요? 되돌릴 수 없어요."))return;const {error}=await db.from("news_posts").delete().eq("id",p.id);if(error)return alert("삭제하지 못했어요: "+error.message);history.pushState(null,"",location.pathname);load()};
    view.append(el("div",{className:"nadm"},[e1,d1]))}
  document.title=ti(p)+" · RIF STUDIO News"}
window.addEventListener("popstate",draw);
/* 쓰기 창 */
const shrink=f=>new Promise((res,rej)=>{const u=URL.createObjectURL(f),im=new Image();im.onload=()=>{const k=Math.min(1,1600/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
  const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>b?res(b):rej(new Error("변환 실패")),"image/jpeg",.86)};im.onerror=()=>rej(new Error("이미지를 읽지 못했어요"));im.src=u});
function editor(p){
  const old=document.getElementById("nedit");if(old)old.remove();
  const f=(lab,node)=>el("label",{},[el("span",{textContent:lab}),node]);
  const tk=el("input",{maxLength:150,value:p?p.title:"",required:true}),bk=el("textarea",{rows:9,maxLength:20000,value:p?p.body:""});
  const tj=el("input",{maxLength:150,value:p&&p.title_ja||""}),bj=el("textarea",{rows:5,maxLength:20000,value:p&&p.body_ja||""});
  const te=el("input",{maxLength:150,value:p&&p.title_en||""}),be=el("textarea",{rows:5,maxLength:20000,value:p&&p.body_en||""});
  const pin=el("input",{type:"checkbox",checked:!!(p&&p.pinned)}),pub=el("input",{type:"checkbox",checked:p?p.published:true});
  let img=p&&p.image_url||"",from=p&&(p.title_ja||p.title_en)?(p.title+"\n"+p.body):"";
  const prev=el("div",{className:"nimgp"}),fi=el("input",{type:"file",accept:"image/*"}),rm=el("button",{type:"button",className:"btn small",textContent:"사진 빼기"});
  const showImg=()=>{prev.replaceChildren(...(img?[el("img",{src:img,alt:""})]:[]));rm.hidden=!img};showImg();rm.onclick=()=>{img="";showImg()};
  const msg=el("p",{className:"note"});
  fi.onchange=async()=>{const file=fi.files[0];fi.value="";if(!file)return;msg.textContent="사진 올리는 중…";
    try{const b=await shrink(file),path="news/"+Date.now()+"-"+Math.random().toString(36).slice(2,7)+".jpg";const {error}=await db.storage.from("portfolio").upload(path,b,{contentType:"image/jpeg"});if(error)throw error;
      img=db.storage.from("portfolio").getPublicUrl(path).data.publicUrl;showImg();msg.textContent=""}catch(e){msg.textContent="사진을 올리지 못했어요: "+(e.message||e)}};
  const trB=el("button",{type:"button",className:"btn ghost",textContent:"일본어 · 영어로 번역"});
  async function translate(){if(!tk.value.trim())throw new Error("제목을 먼저 적어 주세요");trB.disabled=true;msg.textContent="번역하는 중…";
    try{const {data,error}=await db.functions.invoke("news-translate",{body:{title:tk.value,body:bk.value}});
      let m=data&&data.error;if(error&&!m){try{m=(await error.context.json()).error}catch(_){m="번역하지 못했어요"}}if(m)throw new Error(m);
      tj.value=data.ja.title;bj.value=data.ja.body;te.value=data.en.title;be.value=data.en.body;from=tk.value+"\n"+bk.value;tw.open=true;msg.textContent="번역했어요. 아래에서 확인하고 고칠 수 있어요."}
    finally{trB.disabled=false}}
  trB.onclick=()=>translate().catch(e=>{msg.textContent=e.message||String(e)});
  const tw=el("details",{className:"ntr",open:!!(p&&(p.title_ja||p.title_en))},[el("summary",{textContent:"일본어 · 영어 (자동 번역 · 고칠 수 있어요)"}),f("日本語 제목",tj),f("日本語 본문",bj),f("English 제목",te),f("English 본문",be)]);
  const save=el("button",{type:"submit",className:"btn",textContent:"올리기"}),cancel=el("button",{type:"button",className:"btn ghost",textContent:"취소"});
  const form=el("form",{className:"nform"},[el("h2",{textContent:p?"소식 고치기":"새 소식"}),f("제목 (한국어)",tk),f("본문 (한국어)",bk),
    el("div",{className:"nrowf"},[el("span",{className:"note",textContent:"사진 (선택)"}),prev,fi,rm]),
    el("div",{className:"nchk"},[el("label",{},[pin,el("span",{textContent:"맨 위에 고정 (공지)"})]),el("label",{},[pub,el("span",{textContent:"공개 (끄면 우리만 보여요)"})])]),
    el("div",{className:"wr ntrrow"},[el("span",{className:"note",textContent:"따로 안 눌러도 올릴 때 자동으로 번역돼요"}),trB]),tw,msg,el("div",{className:"wr"},[cancel,save])]);
  const mod=el("div",{className:"mod",id:"nedit"},[el("div",{className:"mbox wd"},[form])]);
  const close=()=>{mod.remove();document.removeEventListener("keydown",esc)},esc=e=>{if(e.key==="Escape")close()};document.addEventListener("keydown",esc);
  cancel.onclick=close;mod.onclick=e=>{if(e.target===mod&&confirm("쓰던 내용을 닫을까요?"))close()};
  form.onsubmit=async e=>{e.preventDefault();save.disabled=true;
    try{const now=tk.value+"\n"+bk.value,noTr=!tj.value.trim()&&!te.value.trim();
      if(noTr||(from&&from!==now&&confirm("한국어 내용이 바뀌었어요. 일본어 · 영어 번역도 새로 할까요?\n(취소를 누르면 지금 번역 그대로 저장해요)")))
        await translate().catch(er=>{if(!confirm((er.message||er)+"\n\n번역 없이 한국어로만 올릴까요? (일본어 · 영어 화면에는 한국어가 보여요)"))throw er});
      const row={title:tk.value.trim(),body:bk.value.trim(),title_ja:tj.value.trim()||null,body_ja:bj.value.trim()||null,title_en:te.value.trim()||null,body_en:be.value.trim()||null,image_url:img||null,pinned:pin.checked,published:pub.checked,updated_at:new Date().toISOString()};
      const {error}=p?await db.from("news_posts").update(row).eq("id",p.id):await db.from("news_posts").insert({...row,author_email:me,author_name:me});
      if(error)throw error;close();await load()}
    catch(er){msg.textContent="올리지 못했어요: "+(er.message||er)}finally{save.disabled=false}};
  document.body.append(mod);tk.focus()}
async function load(){
  const {data}=await db.from("news_posts").select("*").order("pinned",{ascending:false}).order("created_at",{ascending:false}).limit(500);
  posts=data||[];draw()}
try{const s=(await db.auth.getSession()).data.session;if(s){me=s.user.email;const {data}=await db.rpc("is_mgmt");staff=!!data}}catch(_){}
document.addEventListener("rif:lang",()=>{L=lng();t=T[L];draw()});
load()})();
