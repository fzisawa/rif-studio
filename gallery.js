(async()=>{
  const ORDER={charmbung:["Premium","Cover","Stem","Vocal"]};
  const g=document.getElementById("grid"),page=g.dataset.page,sec=g.closest(".gal"),admin=await isAdmin();
  const form=addForm(()=>page,()=>{form.hidden=true;load()});form.hidden=true;g.after(form);
  const card=it=>{const c=el("figure",{className:"item"},[media(it)]);
    if(it.caption)c.append(el("figcaption",{textContent:it.caption}));
    if(admin){const x=el("button",{className:"del",textContent:"×",ariaLabel:"삭제"});x.onclick=async()=>{if(confirm("삭제할까요?")){await delItem(it);load()}};c.append(x)}
    return c};
  async function load(){
    g.replaceChildren();
    const {data}=await db.from("items").select("*").eq("page",page).order("created_at",{ascending:false}),list=data||[];
    if(admin){const b=el("button",{className:"plus",textContent:"+",ariaLabel:"추가"});b.onclick=()=>{form.hidden=!form.hidden};g.append(b)}
    if(list.some(i=>i.section)){
      const ord=ORDER[page]||[],rank=n=>{const i=ord.indexOf(n);return i<0?99:i};
      const names=[...new Set(list.filter(i=>i.section).map(i=>i.section))].sort((a,b)=>rank(a)-rank(b));
      names.forEach(n=>{g.append(el("h3",{className:"sec",textContent:n}));
        const its=list.filter(i=>i.section===n).sort((a,b)=>a.created_at<b.created_at?-1:1);
        const w=el("div",{className:"grid"+(its.every(i=>i.kind==="image")?" imgs":"")});its.forEach(i=>w.append(card(i)));g.append(w)});
      const rest=list.filter(i=>!i.section);
      if(rest.length){g.append(el("h3",{className:"sec",textContent:"More"}));rest.forEach(i=>g.append(card(i)))}
    }else list.forEach(i=>g.append(card(i)));
    sec.hidden=!admin&&!list.length}
  load()})();
