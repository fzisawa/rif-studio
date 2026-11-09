(()=>{
const U={"사운드":["vocal","composition","directing","mixing","mastering"],"아트":["illustration","design"],"콘텐츠":["writer","streamer","video"],"매니지먼트":["management","sales"],"기타":["etc"]},
  N={vocal:"보컬",composition:"작곡·편곡",directing:"디렉팅",mixing:"믹싱",mastering:"마스터링",illustration:"일러스트",design:"디자인·굿즈",writer:"작가",streamer:"스트리머",video:"영상",management:"매니지먼트",sales:"영업·운영",etc:"기타"},
  R={korea:"한국",japan:"일본",english:"영미권",other:"기타"};
const flds=r=>{const f=(r.fields||"").split(",").filter(Boolean);return f.map(x=>x==="etc"&&r.field_other?"기타("+r.field_other+")":(N[x]||x)).join(", ")||"-"};
const pad=n=>String(n).padStart(2,"0"),dt=s=>{const d=new Date(s);return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+" "+pad(d.getHours())+":"+pad(d.getMinutes())};
const url=v=>/^https?:\/\//.test(v||"")?v:null;
let rows=[];
function cell(v,cls){return el("td",{className:cls||"",textContent:v||"-"})}
function link(v,cls){const td=el("td",{className:cls||""});const u=url(v);if(u){const a=el("a",{href:u,target:"_blank",rel:"noopener noreferrer",textContent:v});a.onclick=e=>e.stopPropagation();td.append(a)}else td.textContent=v||"-";return td}
function draw(){
  const q=$("q").value.trim().toLowerCase(),tb=$("tb");tb.replaceChildren();
  const view=rows.filter(r=>!q||[r.nickname,r.name,r.email,flds(r),r.discord,r.twitter,R[r.region]].join(" ").toLowerCase().includes(q));
  $("cnt").textContent="지원자 "+view.length+(q?" / "+rows.length:"")+"명";
  view.forEach(r=>{
    const tr=el("tr",{className:"r"},[cell(String(r.no),"no"),cell(dt(r.created_at),"dt"),cell(r.nickname||r.name),cell(r.nickname?r.name:""),cell(r.email),cell(R[r.region]||"-"),cell(flds(r),"ch"),cell(r.discord),link(r.youtube,"ln"),link(r.twitter,"ln")]);
    const dtl=el("tr",{className:"d",hidden:true},[el("td",{colSpan:10},[el("b",{textContent:"자기소개"}),el("p",{textContent:r.intro||"-"}),el("b",{textContent:"지원동기"}),el("p",{textContent:r.motive||"-"}),el("b",{textContent:"경력"}),el("p",{textContent:r.career||"-"})])]);
    const x=el("button",{className:"btn small",textContent:"삭제"});
    x.onclick=async e=>{e.stopPropagation();if(confirm((r.nickname||r.name)+" 지원서를 삭제할까요? 되돌릴 수 없어요.")){const {error}=await db.from("join_requests").delete().eq("id",r.id);if(error)alert("삭제 실패");load()}};
    dtl.firstChild.append(x);tr.onclick=()=>{dtl.hidden=!dtl.hidden};tb.append(tr,dtl)});
  if(!view.length)tb.append(el("tr",{},[el("td",{colSpan:10,textContent:"아직 지원서가 없어요."})]))}
let loaded=false;
async function load(){
  const {data,error}=await db.from("join_requests").select("*").order("created_at",{ascending:true});
  if(error){$("cnt").textContent="불러오기 실패";return}
  rows=(data||[]).map((r,i)=>({...r,no:i+1})).reverse();loaded=true;draw()}
$("q").oninput=draw;
const tab=n=>{$("p1").hidden=n!==1;$("p2").hidden=n!==2;$("t1").setAttribute("aria-pressed",n===1);$("t2").setAttribute("aria-pressed",n===2);$("mn").classList.toggle("wide",n===2);if(n===2)load()};
$("t1").onclick=()=>tab(1);$("t2").onclick=()=>tab(2);
window.__jlist=load;
$("csv").onclick=()=>{const h=["No","접수일시","닉네임","성명","이메일","출신","분야","Discord","YouTube","Twitter","자기소개","지원동기","경력"];
  const q=v=>'"'+String(v==null?"":v).replace(/"/g,'""')+'"';
  const body=[...rows].reverse().map(r=>[r.no,dt(r.created_at),r.nickname||r.name,r.nickname?r.name:"",r.email,R[r.region]||"",flds(r),r.discord,r.youtube,r.twitter,r.intro,r.motive,r.career].map(q).join(","));
  const b=new Blob(["﻿"+[h.map(q).join(","),...body].join("\r\n")],{type:"text/csv;charset=utf-8"});
  const a=el("a",{href:URL.createObjectURL(b),download:"rif-join-applicants.csv"});a.click()};
})();
