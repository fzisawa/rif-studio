(()=>{
  const rows=[...document.querySelectorAll(".tracks li")];if(!rows.length)return;
  const a=new Audio();a.preload="none";let cur=null;
  const fmt=s=>Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0");
  const reset=r=>{r.classList.remove("on");r.querySelector(".pl").textContent="▶";r.querySelector(".pl").setAttribute("aria-label","재생");r.querySelector(".bar u").style.width="0"};
  function play(r){
    if(cur===r){a.paused?a.play():a.pause();return}
    if(cur)reset(cur);cur=r;a.src=r.dataset.src;r.classList.add("on");a.play().catch(()=>{})}
  rows.forEach(r=>{
    r.querySelector(".pl").onclick=()=>play(r);
    r.querySelector(".bar").onclick=e=>{if(cur!==r||!a.duration)return;const b=e.currentTarget.getBoundingClientRect();a.currentTime=a.duration*Math.min(1,Math.max(0,(e.clientX-b.left)/b.width))}});
  a.onplay=()=>{if(cur){cur.querySelector(".pl").textContent="❚❚";cur.querySelector(".pl").setAttribute("aria-label","일시정지")}};
  a.onpause=()=>{if(cur&&!a.ended){cur.querySelector(".pl").textContent="▶";cur.querySelector(".pl").setAttribute("aria-label","재생")}};
  a.ontimeupdate=()=>{if(cur&&a.duration){cur.querySelector(".bar u").style.width=(a.currentTime/a.duration*100)+"%";cur.querySelector(".du").textContent=fmt(a.currentTime)}};
  a.onended=()=>{const i=rows.indexOf(cur),d=cur.dataset.dur;cur.querySelector(".du").textContent=d;reset(cur);const n=rows[i+1];cur=null;if(n)play(n)};
  rows.forEach(r=>r.dataset.dur=r.querySelector(".du").textContent);
})();
