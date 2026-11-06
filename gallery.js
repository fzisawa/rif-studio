(async()=>{
  const g=document.getElementById("grid"),page=g.dataset.page,sec=g.closest(".gal"),admin=await isAdmin();
  const form=addForm(()=>page,()=>{form.hidden=true;load()});form.hidden=true;g.after(form);
  async function load(){
    g.replaceChildren();
    const {data}=await db.from("items").select("*").eq("page",page).order("created_at",{ascending:false});
    if(admin){const b=el("button",{className:"plus",textContent:"+",ariaLabel:"추가"});b.onclick=()=>{form.hidden=!form.hidden};g.append(b)}
    (data||[]).forEach(it=>{const c=el("figure",{className:"item"},[media(it)]);
      if(it.caption)c.append(el("figcaption",{textContent:it.caption}));
      if(admin){const x=el("button",{className:"del",textContent:"×",ariaLabel:"삭제"});x.onclick=async()=>{if(confirm("삭제할까요?")){await delItem(it);load()}};c.append(x)}
      g.append(c)});
    sec.hidden=!admin&&!(data||[]).length}
  load()})();
