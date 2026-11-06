const $=i=>document.getElementById(i),L={rif:"RIF",charmbung:"Charmbung",woljae:"Woljae",contact:"Contact"};
const sel=el("select",{},Object.entries(L).map(([v,t])=>el("option",{value:v,textContent:t+" 페이지"})));
const form=addForm(()=>sel.value,render,[el("label",{textContent:"올릴 페이지"},[sel])]);$("mount").append(form);
const thumb=it=>it.kind==="youtube"?"https://img.youtube.com/vi/"+it.url+"/mqdefault.jpg":it.url;
async function render(){
  const adm=await isAdmin();$("login").hidden=adm;$("app").hidden=!adm;if(!adm)return;
  const {data}=await db.from("items").select("*").order("created_at",{ascending:false}),box=$("items");box.replaceChildren();
  if(!(data||[]).length)box.textContent="아직 올린 게 없어요.";
  Object.keys(L).forEach(p=>{const rows=(data||[]).filter(i=>i.page===p);if(!rows.length)return;
    box.append(el("h3",{textContent:L[p]+" ("+rows.length+")"}));
    rows.forEach(it=>{const x=el("button",{className:"btn small",textContent:"삭제"});
      x.onclick=async()=>{if(confirm("삭제할까요?")){await delItem(it);render()}};
      box.append(el("div",{className:"row"},[el("img",{src:thumb(it),alt:"",loading:"lazy"}),
        el("div",{},[el("b",{textContent:it.caption||"(설명 없음)"}),el("div",{className:"note",textContent:(it.kind==="youtube"?"YouTube":"사진")+" · "+new Date(it.created_at).toLocaleDateString("ko-KR")})]),
        el("a",{href:"../"+p+"/",textContent:"보기"}),x]))})})}
$("login").onsubmit=async e=>{e.preventDefault();const {error}=await db.auth.signInWithPassword({email:$("em").value,password:$("pw").value});
  $("lmsg").textContent=error?"로그인 실패":"";render()};
$("out").onclick=async e=>{e.preventDefault();await db.auth.signOut();render()};
render();
