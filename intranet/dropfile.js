/* 인트라넷 어디서나 파일을 끌어다 놓으면 첨부돼요.
   - 놓은 자리에서 가장 가까운 '파일 첨부 칸'(input[type=file])을 찾아 그 칸에 넣어요 (메일 · 업무 · 자료 · 레퍼런스 · 프로필 사진 등).
   - 칸마다 받는 파일 종류(accept)와 여러 개 가능 여부(multiple)를 그대로 지켜요.
   - 첨부 칸이 없는 곳에 놓으면 브라우저가 파일을 열어 버리지 않게 막고 안내만 해요. */
(()=>{
const hasFiles=e=>!!(e.dataTransfer&&[...(e.dataTransfer.types||[])].includes("Files"));
const shown=x=>{for(let n=x;n&&n!==document.body;n=n.parentElement){if(n.hidden||getComputedStyle(n).display==="none")return false}return true};
/* 놓은 곳에서 위로 올라가며 파일 칸이 들어 있는 가장 가까운 상자를 찾아요 */
function findTarget(node){
  for(let n=node instanceof Element?node:node&&node.parentElement;n&&n!==document.documentElement;n=n.parentElement){
    const ins=[...n.querySelectorAll('input[type="file"]')].filter(i=>!i.disabled&&shown(i.parentElement||i));
    if(ins.length)return {box:n===document.body?null:n,input:ins[0]};
    if(n.matches&&n.matches(".mod,.mbox,.panel,main"))break}
  return null}
const okType=(f,accept)=>{if(!accept)return true;return accept.split(",").map(s=>s.trim().toLowerCase()).filter(Boolean).some(a=>a.startsWith(".")?f.name.toLowerCase().endsWith(a):a.endsWith("/*")?(f.type||"").toLowerCase().startsWith(a.slice(0,-1)):(f.type||"").toLowerCase()===a)};
let hi=null;const mark=b=>{if(hi===b)return;if(hi)hi.classList.remove("dropok");hi=b;if(hi)hi.classList.add("dropok")};
let tip=null,tt=0;const say=m=>{if(!tip){tip=document.createElement("div");tip.className="droptip";document.body.append(tip)}tip.textContent=m;tip.hidden=false;clearTimeout(tt);tt=setTimeout(()=>tip.hidden=true,2200)};
document.addEventListener("dragover",e=>{if(!hasFiles(e))return;e.preventDefault();
  const t=findTarget(e.target);mark(t&&t.box);if(e.dataTransfer)e.dataTransfer.dropEffect=t?"copy":"none"});
document.addEventListener("dragleave",e=>{if(!e.relatedTarget)mark(null)});
document.addEventListener("drop",e=>{if(!hasFiles(e))return;mark(null);
  if(e.defaultPrevented)return; /* 메일 쓰기 본문처럼 따로 받는 곳은 그쪽이 처리해요 */
  e.preventDefault();const t=findTarget(e.target);
  if(!t){say("여기에는 파일을 첨부할 수 없어요. 첨부 칸이 있는 곳에 놓아 주세요.");return}
  const inp=t.input;let fs=[...e.dataTransfer.files].filter(f=>okType(f,inp.accept));
  if(!fs.length){say("이 칸에는 이 종류의 파일을 넣을 수 없어요.");return}
  if(!inp.multiple)fs=fs.slice(0,1);
  try{const dt=new DataTransfer();fs.forEach(f=>dt.items.add(f));inp.files=dt.files}catch(_){say("이 브라우저에서는 끌어다 놓기가 안 돼요. 첨부 버튼을 눌러 주세요.");return}
  inp.dispatchEvent(new Event("change",{bubbles:true}));say("📎 "+(fs.length>1?fs.length+"개 파일":fs[0].name)+" 첨부했어요")});
document.addEventListener("dragend",()=>mark(null));
const st=document.createElement("style");
st.textContent=".dropok{outline:2px dashed var(--ac,#7c5cd6)!important;outline-offset:4px;border-radius:12px}.droptip{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:200;padding:10px 18px;border-radius:99px;background:#1d1b22;color:#fff;font-size:13px;box-shadow:0 8px 24px #0005}.droptip[hidden]{display:none}";
document.head.append(st);
})();
