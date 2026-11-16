/* 포트폴리오 관리: 채널(포트폴리오 페이지) 목록 · 담당자 지정 · 채널 추가/수정/숨김/삭제 */
(()=>{const $=i=>document.getElementById(i);if(!$("chtb"))return;
const CEO="takanashi@rif-studio.com",GO=["vocal","sound","art","content"],G={vocal:"Vocal",sound:"Sound",art:"Art",content:"Content",mgmt:"Management"};
/* 처음부터 있던 기본 페이지 (이름·주소는 고정, 담당자만 정해요). RIF 는 대표님 전용 */
const FIXED=[{slug:"rif",name:"RIF",grp:"vocal",ceoOnly:true},{slug:"charmbung",name:"Charmbung",grp:"sound"},{slug:"se1c",name:"SE1C",grp:"sound"},{slug:"woljae",name:"Woljae",grp:"art"},{slug:"gugugong",name:"gugugong",grp:"art"}];
const RESERVED=["rif","charmbung","se1c","woljae","gugugong","rif-management","join","contact","board","intranet","admin","mail","artist","joinadmin","img","audio","supabase","app","api","www"];
let chans=[],own={},cnt={},meta={},staff=[],edit=null,busy=false,ready=false;const OPEN=new Set();
const lc=s=>String(s||"").trim().toLowerCase();
const who=e=>staff.find(s=>lc(s.email)===lc(e));
const label=e=>{const s=who(e);return s?(s.nickname||s.name||e):e};
const sname=s=>(s.nickname||s.name||s.email)+(s.nickname&&s.name?" ("+s.name+")":"")+(s.team?" · "+s.team:"");
const urlOf=c=>c.fixed?"../"+c.slug+"/":"/artist/?c="+encodeURIComponent(c.slug);
const ord=g=>(GO.indexOf(g)+1)||99;
const all=()=>[...FIXED.map(f=>({...f,fixed:true,visible:true})),...chans.filter(c=>!FIXED.some(f=>f.slug===c.slug)).map(c=>({...c,fixed:false}))].sort((a,b)=>ord(a.grp)-ord(b.grp)||(a.fixed===b.fixed?0:a.fixed?-1:1)||((a.sort||0)-(b.sort||0)));
const msg=(t,bad)=>{const m=$("chmsg");m.className="note"+(bad?" err":"");m.textContent=t||""};
const btn=(t,c)=>el("button",{type:"button",className:"btn small"+(c?" "+c:""),textContent:t});
async function load(){
  const [a,o,i,s,m]=await Promise.all([db.from("channels").select("*").order("sort").order("created_at"),db.from("page_owners").select("page,email"),db.from("items").select("page"),db.rpc("staff_directory"),db.from("page_meta").select("page,lead")]);
  if(a.error){msg("채널을 불러오지 못했어요: "+a.error.message,1);return}
  chans=a.data||[];own={};((o&&o.data)||[]).forEach(r=>{(own[r.page]=own[r.page]||[]).push(String(r.email||""))});
  cnt={};((i&&i.data)||[]).forEach(r=>{cnt[r.page]=(cnt[r.page]||0)+1});
  staff=((s&&s.data)||[]).filter(x=>x&&x.email);meta={};((m&&m.data)||[]).forEach(r=>{meta[r.page]=r.lead||""});
  ready=true;draw();fillOwnerSel()}
function fillOwnerSel(){const sel=$("cho"),cur=sel.value;sel.replaceChildren(el("option",{value:"",textContent:"나중에 지정 (우선 대표님만 수정)"}),...staff.filter(s=>lc(s.email)!==CEO).map(s=>el("option",{value:lc(s.email),textContent:sname(s)})));sel.value=[...sel.options].some(o=>o.value===cur)?cur:""}
function draw(){const tb=$("chtb");tb.replaceChildren();
  all().forEach(c=>{
    const os=(own[c.slug]||[]).filter(e=>lc(e)!==CEO),oc=el("td",{className:"wd oc"});
    if(c.ceoOnly)oc.append(el("span",{className:"note",textContent:"대표님 전용"}));
    else if(!os.length)oc.append(el("span",{className:"note",textContent:"없음 (대표님만 수정)"}));
    else os.forEach(e=>oc.append(el("span",{className:"ownc"+(who(e)?"":" gone"),textContent:label(e),title:e+(who(e)?"":" · 직원 명단에 없는 계정이라 지금은 수정할 수 없어요")})));
    const view=el("a",{href:urlOf(c),target:"_blank",rel:"noopener",className:"btn small",textContent:"페이지 열기"});view.onclick=e=>e.stopPropagation();
    const tr=el("tr",{className:"r"+(c.visible?"":" hid")},[el("td",{},[el("b",{textContent:c.name}),...(c.visible?[]:[el("span",{className:"hs x",textContent:"숨김"})])]),el("td",{className:"hm",textContent:G[c.grp]||c.grp||""}),el("td",{className:"hm sm",textContent:c.fixed?"/"+c.slug+"/":"/artist/?c="+c.slug}),el("td",{textContent:(cnt[c.slug]||0)+"개"}),oc,el("td",{className:"ac hm"},[view])]);
    const dtl=el("tr",{className:"d",hidden:!OPEN.has(c.slug)},[el("td",{colSpan:6},[detail(c,os)])]);
    tr.onclick=()=>{dtl.hidden=!dtl.hidden;if(dtl.hidden)OPEN.delete(c.slug);else OPEN.add(c.slug)};
    tb.append(tr,dtl)})}
function detail(c,os){const box=el("div",{className:"chd"}),ol=el("div",{className:"chow"});
  box.append(el("b",{textContent:"담당자"}));
  if(c.ceoOnly)ol.append(el("p",{className:"note",textContent:"RIF 채널은 대표님만 올리고 지울 수 있어요. 담당자를 따로 두지 않아요."}));
  else{
    os.forEach(e=>{const s=who(e),x=el("button",{type:"button",textContent:"×",title:"담당자에서 빼기"});x.setAttribute("aria-label",label(e)+" 님을 담당자에서 빼기");
      x.onclick=()=>removeOwner(c,e);
      ol.append(el("span",{className:"ownc big"+(s?"":" gone")},[el("span",{textContent:label(e)+(s&&s.team?" · "+s.team:"")}),el("small",{textContent:s?e:"직원 명단에 없는 계정"}),x]))});
    if(!os.length)ol.append(el("p",{className:"note",textContent:"아직 담당자가 없어요. 지금은 대표님만 이 채널을 고칠 수 있어요."}));
    const sel=el("select",{},[el("option",{value:"",textContent:"＋ 담당자 추가…"}),...staff.filter(s=>lc(s.email)!==CEO&&!os.some(e=>lc(e)===lc(s.email))).map(s=>el("option",{value:lc(s.email),textContent:sname(s)})),el("option",{value:"__m",textContent:"명단에 없으면 이메일 직접 입력…"})]);sel.setAttribute("aria-label",c.name+" 담당자 추가");
    const inp=el("input",{type:"email",placeholder:"아이디@rif-studio.com",hidden:true,maxLength:120,autocomplete:"off"}),add=el("button",{type:"button",className:"btn small p",textContent:"추가",hidden:true});
    sel.onchange=()=>{const man=sel.value==="__m";inp.hidden=add.hidden=!man;if(man)inp.focus();else if(sel.value)addOwner(c,sel.value)};
    add.onclick=()=>{const v=lc(inp.value);if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))return alert("이메일 형식으로 적어 주세요 (예: mina@rif-studio.com)");if(os.some(e=>lc(e)===v))return alert("이미 담당자예요.");addOwner(c,v)};
    inp.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();add.click()}};
    ol.append(el("div",{className:"chadd"},[sel,inp,add]))}
  box.append(ol);
  const acts=el("div",{className:"dact"},[el("a",{href:urlOf(c),target:"_blank",rel:"noopener",className:"btn small mo",textContent:"페이지 열기"})]);
  if(c.fixed)box.append(el("p",{className:"note",textContent:"처음부터 있던 기본 페이지라 이름·주소·메뉴 위치는 고정이에요. 사진·영상·탭·캐치프레이즈·경력은 '페이지 열기'로 들어가서 바로 고칠 수 있어요."}),acts);
  else{const ed=btn("채널 정보 수정"),hv=btn(c.visible?"메뉴에서 숨기기":"메뉴에 다시 보이기"),del=btn("채널 삭제","danger");
    ed.onclick=()=>fill(c);
    hv.onclick=async()=>{hv.disabled=true;const {error}=await db.from("channels").update({visible:!c.visible}).eq("slug",c.slug);hv.disabled=false;
      if(error)return alert("바꾸지 못했어요: "+error.message);msg(c.name+" 채널을 "+(c.visible?"메뉴에서 숨겼어요. 대표님에게만 보여요.":"메뉴에 다시 보이게 했어요."));await load();chg()};
    del.onclick=async()=>{if(!confirm(c.name+" 채널을 삭제할까요?\n\n· 사이트 메뉴와 페이지가 사라지고, 담당자 지정도 풀려요\n· 올린 포트폴리오 "+(cnt[c.slug]||0)+"개는 지워지지 않고 남아서, 같은 주소로 다시 만들면 돌아와요"))return;
      del.disabled=true;const {error}=await db.from("channels").delete().eq("slug",c.slug);if(error){del.disabled=false;return alert("삭제하지 못했어요: "+error.message)}
      await db.from("page_owners").delete().eq("page",c.slug);OPEN.delete(c.slug);if(edit===c.slug)closeForm();msg(c.name+" 채널을 삭제했어요.");await load();chg()};
    acts.append(ed,hv,del);box.append(acts)}
  return box}
const chg=()=>document.dispatchEvent(new Event("rif-channels"));
async function addOwner(c,e){if(busy)return;busy=true;const {error}=await db.from("page_owners").insert({page:c.slug,email:e});busy=false;
  if(error&&!/duplicate|unique/i.test(error.message||""))return alert("담당자로 넣지 못했어요: "+error.message);
  OPEN.add(c.slug);msg(label(e)+" 님을 "+c.name+" 담당자로 지정했어요. 이제 그 계정으로 로그인하면 자기 페이지에서 바로 고칠 수 있어요.");load()}
async function removeOwner(c,e){if(!confirm(label(e)+" 님을 "+c.name+" 담당자에서 뺄까요?\n빼면 이 채널을 더 이상 고칠 수 없어요. (올린 포트폴리오는 그대로 남아요)"))return;
  const {error}=await db.from("page_owners").delete().eq("page",c.slug).eq("email",e);if(error)return alert("빼지 못했어요: "+error.message);
  OPEN.add(c.slug);msg(label(e)+" 님을 "+c.name+" 담당자에서 뺐어요.");load()}
/* 새 채널 추가 · 채널 정보 수정 */
function closeForm(){edit=null;$("chf").hidden=true;$("chm").textContent=""}
function fill(c){edit=c?c.slug:null;$("chf").hidden=false;$("cht").textContent=c?c.name+" 채널 정보 수정":"새 채널 추가";$("chs").value=c?c.slug:"";$("chs").readOnly=!!c;$("chn").value=c?c.name:"";$("chg").value=c&&G[c.grp]?c.grp:"art";$("cht2").value=c?(c.tag||""):"";$("chow").hidden=!!c;$("cho").value="";$("chv").value=c&&!c.visible?"0":"1";$("chld").value=c?(meta[c.slug]||c.lead||""):"";$("chm").className="note";$("chm").textContent="";
  $("chf").scrollIntoView({behavior:"smooth",block:"center"});(c?$("chn"):$("chs")).focus({preventScroll:true})}
$("chnew").onclick=()=>{if(!$("chf").hidden&&!edit)return closeForm();fill(null)};
$("chc").onclick=closeForm;
$("chf").onsubmit=async e=>{e.preventDefault();const slug=lc($("chs").value),name=$("chn").value.trim(),owner=$("cho").value,lead=$("chld").value.trim();
  const bad=t=>{$("chm").className="note err";$("chm").textContent=t};
  if(!/^[a-z0-9][a-z0-9-]{1,30}$/.test(slug))return bad("주소 이름은 영문 소문자·숫자·- 로 2~31자예요");
  if(!edit&&(RESERVED.includes(slug)||chans.some(c=>c.slug===slug)))return bad("이미 쓰고 있는 주소예요. 다른 이름을 골라 주세요");
  if(!name)return bad("표시 이름을 적어 주세요");
  const row={name,grp:$("chg").value,tag:$("cht2").value.trim()||null,lead:lead||null,visible:$("chv").value==="1"};
  const b=$("chsave");b.disabled=true;$("chm").className="note";$("chm").textContent="저장 중…";
  let error=null,warn="";
  if(edit){({error}=await db.from("channels").update(row).eq("slug",edit));
    /* 담당자가 자기 페이지에서 바꾼 캐치프레이즈가 있으면(페이지는 그 값을 먼저 보여 줘요) 그쪽도 같이 바꿔요 */
    if(!error&&meta[edit]&&meta[edit]!==lead){const r=await db.from("page_meta").update({lead:lead||null}).eq("page",edit);if(r.error)warn=" (캐치프레이즈는 페이지에서 직접 바꿔 주세요)"}}
  else{({error}=await db.from("channels").insert({slug,...row,sort:chans.reduce((n,c)=>Math.max(n,(c.sort||0)+1),0)}));
    if(!error&&owner){const r=await db.from("page_owners").insert({page:slug,email:owner});if(r.error&&!/duplicate|unique/i.test(r.error.message||""))warn=" (담당자는 저장하지 못했어요. 표에서 다시 지정해 주세요)"}}
  b.disabled=false;if(error)return bad("저장하지 못했어요: "+(/duplicate|unique/i.test(error.message||"")?"이미 있는 주소예요":error.message));
  const was=edit;closeForm();OPEN.add(slug);msg((was?name+" 채널 정보를 고쳤어요.":name+" 채널을 만들었어요. 사이트 메뉴에는 1분 안에 보여요.")+warn);await load();chg()};
document.addEventListener("rif-items",()=>{if(ready)load()});
const ap=$("app");const go=()=>{if(!ap.hidden)load();else{ready=false;$("chtb").replaceChildren();closeForm()}};new MutationObserver(go).observe(ap,{attributes:true,attributeFilter:["hidden"]});go()})();
