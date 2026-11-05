const $=i=>document.getElementById(i),B="portfolio";
const db=supabase.createClient(RIF.URL,RIF.KEY);
let admin=false;
const ytid=u=>(u.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/)||[])[1];
const el=(t,p={},k=[])=>{const e=Object.assign(document.createElement(t),p);k.forEach(c=>e.append(c));return e};
async function load(){
  const g=$("grid");g.replaceChildren();
  if(admin){const b=el("button",{className:"plus",textContent:"+",ariaLabel:"추가"});b.onclick=()=>{$("panel").hidden=!$("panel").hidden};g.append(b)}
  const {data}=await db.from("items").select("*").order("created_at",{ascending:false});
  (data||[]).forEach(it=>{
    const m=it.kind==="youtube"
      ?el("iframe",{loading:"lazy",allowFullscreen:true,src:"https://www.youtube-nocookie.com/embed/"+it.url})
      :el("img",{loading:"lazy",src:it.url,alt:it.caption||""});
    const c=el("figure",{className:"item"},[m]);
    if(it.caption)c.append(el("figcaption",{textContent:it.caption}));
    if(admin){const x=el("button",{className:"del",textContent:"×",ariaLabel:"삭제"});
      x.onclick=async()=>{if(!confirm("삭제할까요?"))return;if(it.path)await db.storage.from(B).remove([it.path]);await db.from("items").delete().eq("id",it.id);load()};c.append(x)}
    g.append(c)});
}
function shrink(f){return new Promise(r=>{const i=new Image();i.onload=()=>{const s=Math.min(1,1600/Math.max(i.width,i.height)),c=el("canvas",{width:i.width*s,height:i.height*s});c.getContext("2d").drawImage(i,0,0,c.width,c.height);c.toBlob(r,"image/jpeg",.85)};i.src=URL.createObjectURL(f)})}
$("yt").oninput=e=>{const v=ytid(e.target.value);$("prev").replaceChildren(...(v?[el("iframe",{src:"https://www.youtube-nocookie.com/embed/"+v})]:[]))};
$("add").onclick=async()=>{
  const cap=$("cap").value.trim()||null,f=$("file").files[0],v=ytid($("yt").value),m=$("msg");
  if(!f&&!v){m.textContent="유튜브 링크나 사진을 넣어 주세요";return}
  m.textContent="올리는 중…";
  try{
    let row;
    if(f){const path=Date.now()+".jpg";const {error}=await db.storage.from(B).upload(path,await shrink(f),{contentType:"image/jpeg"});if(error)throw error;
      row={kind:"image",url:db.storage.from(B).getPublicUrl(path).data.publicUrl,path,caption:cap}}
    else row={kind:"youtube",url:v,caption:cap};
    const {error}=await db.from("items").insert(row);if(error)throw error;
    $("yt").value=$("file").value=$("cap").value="";$("prev").replaceChildren();m.textContent="";$("panel").hidden=true;load();
  }catch(e){m.textContent="실패: "+e.message}};
$("adm").onclick=async e=>{e.preventDefault();if(admin){await db.auth.signOut();admin=false;$("panel").hidden=true;$("adm").textContent="admin";load()}else $("login").hidden=!$("login").hidden};
$("login").onsubmit=async e=>{e.preventDefault();const {error}=await db.auth.signInWithPassword({email:$("em").value,password:$("pw").value});
  if(error){$("lmsg").textContent="로그인 실패";return}admin=true;$("login").hidden=true;$("adm").textContent="logout";load()};
db.auth.getSession().then(({data})=>{admin=!!data.session;if(admin)$("adm").textContent="logout";load()});
