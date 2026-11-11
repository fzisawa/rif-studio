(()=>{
const $=i=>document.getElementById(i);
const T={
ko:{h:"문의 게시판",lead:"궁금한 점이나 제안을 남겨 주세요. 비밀글은 작성자와 운영진만 볼 수 있어요.",write:"글쓰기",cancel:"닫기",n:"이름 (목록에는 가려서 보여요)",e:"이메일 (공개되지 않아요 · 답변 안내용)",t:"제목",b:"내용",s:"비밀글로 올리기",send:"올리기",sending:"올리는 중…",ok:"등록했어요. 운영진이 확인하고 답변드릴게요.",empty:"아직 글이 없어요. 첫 글을 남겨 보세요.",secret:"비밀글입니다",secnote:"비밀글이에요. 작성자와 운영진만 볼 수 있어요.",reply:"RIF STUDIO 답변",done:"답변 완료",prev:"이전",next:"다음",total:"전체 ",unit:"건",load:"불러오는 중…",fail:"불러오지 못했어요.",rate:"짧은 시간에 너무 많이 올렸어요. 잠시 후 다시 시도해 주세요.",bad:"입력한 내용을 확인해 주세요 (이메일 형식 등).",srv:"등록하지 못했어요. 잠시 후 다시 시도해 주세요.",closed:"지금은 글쓰기를 잠시 닫아 두었어요. 글 읽기는 계속 가능해요."},
en:{h:"Inquiry Board",lead:"Leave your questions or ideas. Private posts are visible only to you and our team.",write:"Write",cancel:"Close",n:"Name (partly hidden in the list)",e:"Email (kept private · for replies)",t:"Title",b:"Message",s:"Post as private",send:"Post",sending:"Posting…",ok:"Posted. Our team will review and reply.",empty:"No posts yet. Be the first to write.",secret:"Private post",secnote:"This is a private post. Only the author and our team can read it.",reply:"RIF STUDIO reply",done:"Answered",prev:"Prev",next:"Next",total:"Total ",unit:"",load:"Loading…",fail:"Could not load.",rate:"Too many posts in a short time. Please try again later.",bad:"Please check your input (e.g. email format).",srv:"Could not post. Please try again later.",closed:"Posting is temporarily closed. You can still read posts."},
ja:{h:"お問い合わせ掲示板",lead:"ご質問やご提案をお寄せください。非公開の投稿は、投稿者と運営のみ閲覧できます。",write:"書き込む",cancel:"閉じる",n:"お名前（一覧では一部伏せます）",e:"メール（非公開・返信のご案内用）",t:"タイトル",b:"内容",s:"非公開で投稿",send:"投稿する",sending:"投稿中…",ok:"投稿しました。運営が確認して返信します。",empty:"まだ投稿がありません。最初の投稿をどうぞ。",secret:"非公開の投稿です",secnote:"非公開の投稿です。投稿者と運営のみ閲覧できます。",reply:"RIF STUDIO からの返信",done:"回答済み",prev:"前へ",next:"次へ",total:"全 ",unit:"件",load:"読み込み中…",fail:"読み込めませんでした。",rate:"短時間に投稿が多すぎます。しばらくしてからお試しください。",bad:"入力内容をご確認ください（メール形式など）。",srv:"投稿できませんでした。しばらくしてからお試しください。",closed:"現在、書き込みを一時停止しています。閲覧は可能です。"}};
const L=()=>T[(document.documentElement.lang||"ko").slice(0,2)]||T.ko;
const PER=20;let page=0,total=0,opened=null,rows=[];
const fd=s=>{const d=new Date(s),p=n=>String(n).padStart(2,"0");return d.getFullYear()+"."+p(d.getMonth()+1)+"."+p(d.getDate())};
const closed=()=>!!((window.RIF||{}).MAINT||{}).board;
function labels(){const t=L();$("bdh").textContent=t.h;$("bdlead").textContent=t.lead;$("bdw").textContent=$("bdf").hidden?t.write:t.cancel;
  $("lbn").textContent=t.n;$("lbe").textContent=t.e;$("lbt").textContent=t.t;$("lbb").textContent=t.b;$("lbs").textContent=t.s;$("bsend").textContent=t.send;
  const c=$("bdclosed");c.hidden=!closed();c.textContent=t.closed;$("bdw").hidden=closed();draw()}
function draw(){const t=L(),ul=$("bdl");ul.replaceChildren();$("bdc").textContent=total?t.total+total+(t.unit?" "+t.unit:""):"";
  if(!rows.length){ul.append(el("li",{style:"padding:28px 4px;color:var(--mut)",textContent:t.empty}));$("bpg").replaceChildren();return}
  rows.forEach(r=>{const li=el("li"),row=el("div",{className:"bd-row"},[el("span",{className:"bd-no",textContent:r.id}),
      el("span",{className:"bd-t"},[document.createTextNode((r.secret?"🔒 ":"")+(r.secret?t.secret:r.title)),...(r.answered?[el("span",{className:"bd-ok",textContent:t.done})]:[])]),el("span",{className:"bd-m",textContent:r.who+" · "+fd(r.created_at)})]);
    li.append(row);
    if(opened===r.id){const box=el("div",{className:"bd-dt"});li.append(box);
      if(r.secret)box.textContent=t.secnote;else{box.textContent=t.load;db.rpc("inquiry_get",{p_id:r.id}).then(({data})=>{const d=data&&data[0];box.replaceChildren();if(!d){box.textContent=t.fail;return}
        box.append(el("div",{className:"bd-b",textContent:d.body}));if(d.reply)box.append(el("div",{className:"bd-rp"},[el("b",{textContent:t.reply}),document.createTextNode(d.reply)]))})}}
    row.onclick=()=>{opened=opened===r.id?null:r.id;draw()};ul.append(li)});
  const pages=Math.ceil(total/PER),pg=$("bpg");pg.replaceChildren();
  if(pages>1){const pv=el("button",{className:"bd-btn ghost",type:"button",textContent:t.prev,disabled:page<=0}),nx=el("button",{className:"bd-btn ghost",type:"button",textContent:t.next,disabled:page>=pages-1});
    pv.onclick=()=>{page--;load()};nx.onclick=()=>{page++;load()};pg.append(pv,el("span",{textContent:(page+1)+" / "+pages}),nx)}}
async function load(){const {data,error}=await db.rpc("inquiry_list",{p_limit:PER,p_offset:page*PER});if(error){$("bdc").textContent=L().fail;return}
  rows=data||[];total=rows.length?Number(rows[0].total):0;opened=null;draw()}
$("bdw").onclick=()=>{$("bdf").hidden=!$("bdf").hidden;labels()};
$("bdf").onsubmit=async e=>{e.preventDefault();const t=L(),m=$("bmsg");if(closed())return;m.className="bd-msg";m.textContent=t.sending;$("bsend").disabled=true;
  let err="";try{const {data,error}=await db.functions.invoke("inquiry-post",{body:{name:$("bn").value,email:$("be").value,title:$("bt").value,body:$("bb").value,secret:$("bs").checked,website:$("bw").value}});
    if(error){let j={};try{j=await error.context.json()}catch(_){}err=j.error||"server"}else if(!data||!data.ok)err="server"}catch(_){err="server"}
  $("bsend").disabled=false;if(err){m.className="bd-msg err";m.textContent=err==="rate"?t.rate:["name","email","title","body"].includes(err)?t.bad:t.srv;return}
  m.textContent=t.ok;["bn","be","bt","bb"].forEach(i=>$(i).value="");$("bs").checked=false;page=0;load()};
try{new MutationObserver(labels).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]})}catch(_){}
labels();load();
})();
