const $=i=>document.getElementById(i),L={rif:"RIF",charmbung:"Charmbung",se1c:"SE1C",woljae:"Woljae",gugugong:"gugugong"},CH={};
/* 탭: 인사정보 / 포트폴리오 관리 (주소 끝에 #portfolio 를 붙이면 포트폴리오 관리가 바로 열려요) */
const TABS={t3:"p3",t1:"p1"};
function showTab(t){Object.keys(TABS).forEach(b=>{$(b).setAttribute("aria-pressed",String(b===t));$(TABS[b]).hidden=b!==t});try{history.replaceState(null,"",t==="t1"?"#portfolio":"#hr")}catch(_){}}
$("t3").onclick=()=>showTab("t3");$("t1").onclick=()=>showTab("t1");
showTab(location.hash==="#portfolio"?"t1":"t3");
/* 여기서 바로 올리기 */
const sel=el("select",{},Object.entries(L).map(([v,t])=>el("option",{value:v,textContent:t+" 페이지"})));
const changed=()=>document.dispatchEvent(new Event("rif-items"));
const form=addForm(()=>sel.value,()=>{render();changed()},[el("label",{textContent:"올릴 페이지"},[sel])]);$("mount").append(form);
sel.onchange=()=>form.fill();
/* 채널 관리에서 추가한 채널도 올릴 페이지로 */
function syncPages(){return db.from("channels").select("slug,name").order("sort").then(({data})=>{(data||[]).forEach(c=>{if(L[c.slug])return;L[c.slug]=c.name;CH[c.slug]=1;sel.append(el("option",{value:c.slug,textContent:c.name+" 페이지"}))})})}
const thumb=it=>it.kind==="youtube"?"https://img.youtube.com/vi/"+it.url+"/mqdefault.jpg":it.url;
async function render(){
  const adm=await isAdmin();$("login").hidden=adm;$("app").hidden=!adm;if(!adm)return;
  const {data}=await db.from("items").select("*").order("created_at",{ascending:false}),box=$("items");
  const open=new Set([...box.querySelectorAll("details[open]")].map(d=>d.dataset.p));box.replaceChildren();
  if(!(data||[]).length)box.textContent="아직 올린 게 없어요.";
  Object.keys(L).forEach(p=>{const rows=(data||[]).filter(i=>i.page===p);if(!rows.length)return;
    /* 채널마다 접어 두고, 누르면 펼쳐져요 */
    const g=el("details",{className:"igrp",open:open.has(p)},[el("summary",{textContent:L[p]+" ("+rows.length+")"})]);g.dataset.p=p;
    rows.forEach(it=>{const x=el("button",{className:"btn small",textContent:"삭제"});
      x.onclick=async()=>{if(!confirm("'"+(it.caption||"설명 없음")+"' 을(를) 삭제할까요?\n페이지에서 바로 사라지고 되돌릴 수 없어요."))return;x.disabled=true;
        try{await delItem(it)}catch(e){x.disabled=false;return alert("삭제하지 못했어요: "+(e.message||e))}render();changed()};
      g.append(el("div",{className:"row"},[(it.kind==="audio"?el("div",{className:"ico",textContent:"♪"}):el("img",{src:thumb(it),alt:"",loading:"lazy"})),
        el("div",{},[el("b",{textContent:it.caption||"(설명 없음)"}),el("div",{className:"note",textContent:({youtube:"YouTube",audio:"음원",image:"사진"}[it.kind])+(it.section?" · "+it.section:"")+" · "+new Date(it.created_at).toLocaleDateString("ko-KR")})]),
        el("a",{href:CH[p]?"/artist/?c="+p:"../"+p+"/",target:"_blank",rel:"noopener",textContent:"보기"}),x]))});
    box.append(g)})}
$("login").onsubmit=async e=>{e.preventDefault();const {error}=await db.auth.signInWithPassword({email:$("em").value,password:$("pw").value});
  $("lmsg").textContent=error?"로그인 실패":"";if(!error)$("pw").value="";render()};
$("out").onclick=async e=>{e.preventDefault();await db.auth.signOut();render()};
/* 채널이 추가·삭제되면 올릴 페이지 목록도 다시 맞춰요 */
document.addEventListener("rif-channels",()=>{[...sel.options].forEach(o=>{if(CH[o.value]){delete L[o.value];delete CH[o.value];o.remove()}});syncPages().then(()=>{form.fill();render()})});
render();syncPages().then(()=>{form.fill();render()},()=>{});
