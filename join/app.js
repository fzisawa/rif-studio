const T=(k,f)=>window.T?window.T(k,f):f;
const $=i=>document.getElementById(i),db=supabase.createClient(RIF.URL,RIF.KEY);
const U={"사운드":["vocal","composition","directing","mixing","mastering"],"아트":["illustration","design"],"콘텐츠":["writer","streamer","video"],"매니지먼트":["management","sales"],"기타":["etc"]},
  N={vocal:"보컬",composition:"작곡·편곡",directing:"디렉팅",mixing:"믹싱",mastering:"마스터링",illustration:"일러스트",design:"디자인·굿즈",writer:"작가",streamer:"스트리머",video:"영상",management:"매니지먼트",sales:"영업·운영",etc:"기타"},
  fmt=v=>{const f=(v||"").split(",").filter(Boolean);if(!f.length)return"-";const o=Object.entries(U).map(([u,k])=>{const h=f.filter(x=>k.includes(x));return h.length?u+"("+h.map(x=>N[x]).join(", ")+")":""}).filter(Boolean);const r=f.filter(x=>!N[x]);return o.concat(r).join(" · ")};
const el=(t,p={},k=[])=>{const e=Object.assign(document.createElement(t),p);k.forEach(c=>e.append(c));return e};
$("f").onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target),d=Object.fromEntries(fd),m=$("m"),fl=fd.getAll("field");
  if(d.website)return;
  if(!fl.length){m.textContent=T("join.nof","분야를 하나 이상 선택해 주세요.");return}
  if(!window.__yes){askSure(()=>{window.__yes=true;e.target.requestSubmit()});return}window.__yes=false;
  const fo=fl.includes("etc")?(d.field_other||"").trim()||null:null;$("go").disabled=true;m.textContent=T("join.sending","보내는 중…");
  const {error}=await db.from("join_requests").insert({nickname:d.nickname.trim(),name:(d.name||"").trim()||null,email:d.email.trim(),youtube:d.youtube.trim()||null,twitter:d.twitter.trim()||null,intro:d.intro.trim(),fields:fl.join(","),field_other:fo,region:d.region,discord:d.discord.trim(),motive:d.motive.trim(),career:(d.career||"").trim()||null});
  if(error){m.textContent=T("join.fail","전송에 실패했어요. 잠시 후 다시 시도하거나 rif@rif-studio.com으로 보내주세요.");$("go").disabled=false;return}
  try{const body={subject:"[Join Us] "+d.nickname,nickname:d.nickname,name:d.name||"-",email:d.email,youtube:d.youtube||"-",twitter:d.twitter||"-",fields:fl.join(", ")+(fo?" ("+fo+")":""),region:d.region,discord:d.discord,motive:d.motive,career:d.career||"-",message:d.intro};
    if(RIF.MAIL_KEY)await fetch("https://api.web3forms.com/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({access_key:RIF.MAIL_KEY,from_name:"RIF STUDIO Join Us",...body})});
    else if(RIF.MAIL_TO)await fetch("https://formsubmit.co/ajax/"+RIF.MAIL_TO,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({_subject:body.subject,_template:"table",_captcha:"false",...body})})}catch(_){}
  e.target.reset();m.textContent="";$("go").disabled=false;$("fo").hidden=true;showDone()};
function askSure(go){const o=$("sure");o.hidden=false;$("sy").focus();const c=()=>{o.hidden=true;document.removeEventListener("keydown",k)},k=e=>{if(e.key==="Escape")c()};document.addEventListener("keydown",k);$("sy").onclick=()=>{c();go()};$("sn").onclick=c;o.onclick=e=>{if(e.target===o)c()}}
function showDone(){const o=$("done");o.hidden=false;$("dok").focus();const c=()=>{o.hidden=true;document.removeEventListener("keydown",k)},k=e=>{if(e.key==="Escape")c()};document.addEventListener("keydown",k);$("dok").onclick=c;o.onclick=e=>{if(e.target===o)c()}}

$("f").addEventListener("change",e=>{if(e.target.value==="etc"){const o=$("fo");o.hidden=!e.target.checked;if(!o.hidden)o.focus()}});
