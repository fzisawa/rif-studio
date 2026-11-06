const db=supabase.createClient(RIF.URL,RIF.KEY),B="portfolio";
const el=(t,p={},k=[])=>{const e=Object.assign(document.createElement(t),p);k.forEach(c=>e.append(c));return e};
const ytid=u=>(u.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/)||[])[1];
const shrink=f=>new Promise(r=>{const i=new Image();i.onload=()=>{const s=Math.min(1,1600/Math.max(i.width,i.height)),c=el("canvas",{width:i.width*s,height:i.height*s});c.getContext("2d").drawImage(i,0,0,c.width,c.height);c.toBlob(r,"image/jpeg",.85)};i.src=URL.createObjectURL(f)});
const isAdmin=async()=>!!(await db.auth.getSession()).data.session;
async function addItem(page,file,yt,cap){
  const v=ytid(yt||"");if(!file&&!v)throw new Error("유튜브 링크나 사진을 넣어 주세요");
  let row;
  if(file){const path=Date.now()+".jpg";const {error}=await db.storage.from(B).upload(path,await shrink(file),{contentType:"image/jpeg"});if(error)throw error;
    row={kind:"image",url:db.storage.from(B).getPublicUrl(path).data.publicUrl,path}}
  else row={kind:"youtube",url:v};
  row.page=page;row.caption=cap||null;
  const {error}=await db.from("items").insert(row);if(error)throw error}
async function delItem(it){if(it.path)await db.storage.from(B).remove([it.path]);const {error}=await db.from("items").delete().eq("id",it.id);if(error)throw error}
const media=it=>it.kind==="youtube"?el("iframe",{loading:"lazy",allowFullscreen:true,src:"https://www.youtube-nocookie.com/embed/"+it.url}):el("img",{loading:"lazy",src:it.url,alt:it.caption||""});
function addForm(getPage,done,extra=[]){
  const yt=el("input",{placeholder:"유튜브 링크 붙여넣기"}),file=el("input",{type:"file",accept:"image/*"}),cap=el("input",{placeholder:"설명 (선택)"}),prev=el("div"),msg=el("p",{className:"note"}),btn=el("button",{className:"btn",textContent:"추가"});
  yt.oninput=()=>{const v=ytid(yt.value);prev.replaceChildren(...(v?[el("iframe",{src:"https://www.youtube-nocookie.com/embed/"+v})]:[]))};
  btn.onclick=async()=>{msg.textContent="올리는 중…";btn.disabled=true;
    try{await addItem(getPage(),file.files[0],yt.value,cap.value.trim());yt.value=file.value=cap.value="";prev.replaceChildren();msg.textContent="";done()}
    catch(e){msg.textContent="실패: "+e.message}btn.disabled=false};
  return el("div",{id:"panel"},[...extra,yt,file,cap,prev,btn,msg])}
