/* 채널 관리: 계약자 포트폴리오 페이지(/artist/?c=주소) 추가·수정 */
(()=>{const $=i=>document.getElementById(i);if(!$("chf"))return;
const RESERVED=["rif","charmbung","se1c","woljae","gugugong","rif-management","join","contact","board","intranet","admin","mail","artist","joinadmin","img","audio","supabase"];
const G={vocal:"Vocal",sound:"Sound",art:"Art",content:"Content",mgmt:"Management"};
let edit=null,list=[];
async function load(){const box=$("chl");box.replaceChildren();
  const [a,o]=await Promise.all([db.from("channels").select("*").order("sort").order("created_at"),db.from("page_owners").select("page,email")]);
  if(a.error){box.append(el("p",{className:"note err",textContent:"채널을 불러오지 못했어요: "+a.error.message}));return}
  list=a.data||[];const own={};(o.data||[]).forEach(r=>{(own[r.page]=own[r.page]||[]).push(r.email)});
  if(!list.length){box.append(el("p",{className:"note",textContent:"아직 추가한 채널이 없어요. (기존 Charmbung · SE1C · Woljae · gugugong 페이지는 그대로 있어요)"}));return}
  list.forEach(c=>{const ed=el("button",{type:"button",className:"btn small ghost",textContent:"수정"}),del=el("button",{type:"button",className:"btn small ghost",textContent:"삭제"});
    ed.onclick=()=>fill(c,(own[c.slug]||[])[0]||"");
    del.onclick=async()=>{if(!confirm(c.name+" 채널을 삭제할까요?\n메뉴와 페이지가 사라져요. 올린 포트폴리오 기록은 남아 있어서 같은 주소로 다시 만들면 돌아와요."))return;
      const {error}=await db.from("channels").delete().eq("slug",c.slug);if(error)return alert("삭제하지 못했어요: "+error.message);await db.from("page_owners").delete().eq("page",c.slug);load()};
    box.append(el("div",{className:"row",style:"display:flex;gap:12px;align-items:center;padding:10px 0;border-top:1px solid var(--line,#7773)"},[el("div",{style:"flex:1;min-width:0"},[el("b",{textContent:c.name+(c.visible?"":" (숨김)")}),el("div",{className:"note",textContent:G[c.grp]+" · /artist/?c="+c.slug+" · 주인 "+((own[c.slug]||[]).join(", ")||"없음")})]),el("a",{href:"/artist/?c="+c.slug,target:"_blank",rel:"noopener",textContent:"보기"}),ed,del]))})}
function fill(c,owner){edit=c?c.slug:null;$("cht").textContent=c?c.name+" 수정":"새 채널 추가";$("chs").value=c?c.slug:"";$("chs").readOnly=!!c;$("chn").value=c?c.name:"";$("chg").value=c?c.grp:"art";$("cht2").value=c?(c.tag||""):"";$("cho").value=owner||"";$("chv").value=c&&!c.visible?"0":"1";$("chld").value=c?(c.lead||""):"";$("chc").hidden=!c;$("chm").textContent="";if(c)$("chf").scrollIntoView({behavior:"smooth",block:"center"})}
$("chc").onclick=()=>fill(null);
$("chf").onsubmit=async e=>{e.preventDefault();const slug=$("chs").value.trim().toLowerCase(),name=$("chn").value.trim(),owner=$("cho").value.trim().toLowerCase();
  if(!/^[a-z0-9][a-z0-9-]{1,30}$/.test(slug))return $("chm").textContent="주소 이름은 영문 소문자·숫자·- 로 2~31자예요";
  if(!edit&&(RESERVED.includes(slug)||list.some(c=>c.slug===slug)))return $("chm").textContent="이미 쓰고 있는 주소예요";
  if(!name)return $("chm").textContent="표시 이름을 적어 주세요";
  const row={slug,name,grp:$("chg").value,tag:$("cht2").value.trim()||null,lead:$("chld").value.trim()||null,visible:$("chv").value==="1"};
  const b=$("chsave");b.disabled=true;$("chm").textContent="저장 중…";
  let {error}=edit?await db.from("channels").update(row).eq("slug",slug):await db.from("channels").insert({...row,sort:list.length});
  if(!error){await db.from("page_owners").delete().eq("page",slug);if(owner){const r=await db.from("page_owners").insert({page:slug,email:owner});error=r.error}}
  b.disabled=false;if(error){$("chm").textContent="저장하지 못했어요: "+error.message;return}
  fill(null);$("chm").textContent="저장했어요. 사이트 메뉴에 1분 안에 보여요.";load()};
const ap=$("app");const go=()=>{if(!ap.hidden)load()};new MutationObserver(go).observe(ap,{attributes:true,attributeFilter:["hidden"]});go()})();
