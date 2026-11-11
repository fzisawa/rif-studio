(async()=>{
  const g=document.getElementById("grid"),page=g.dataset.page,sec=g.closest(".gal"),main=document.querySelector("main"),
        tracks=page==="rif"?document.querySelector(".tracks"):null,admin=await isAdmin();
  const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),hash=()=>decodeURIComponent(location.hash.slice(1)).toLowerCase();
  let list=[],active=null,top=hash()==="portfolio"?"Portfolio":"Tracks";
  const bar=el("div",{className:"tabs"}),topBar=el("div",{className:"tabs top"});
  g.before(bar);if(tracks)tracks.before(topBar);
  const form=addForm(()=>page,s=>{if(s)active=s;form.hidden=true;load()},[],()=>active);form.hidden=true;g.after(form);
  const card=it=>{const c=el("figure",{className:"item"},[media(it)]);
    if(it.caption)c.append(el("figcaption",{textContent:it.caption,title:it.caption}));
    if(admin){const x=el("button",{className:"del",textContent:"×",ariaLabel:"삭제"});x.onclick=async()=>{if(confirm("삭제할까요?")){await delItem(it);load()}};c.append(x)}
    return c};
  const tabs=(box,names,cur,pick)=>box.replaceChildren(...names.map(n=>{const b=el("button",{className:"tab"+(n===cur?" on":""),type:"button",textContent:n});b.onclick=()=>pick(n);return b}));
  const go=n=>history.replaceState(null,"","#"+slug(n));
  function render(){
    const sectioned=!!CATS[page]||list.some(i=>i.section);let its=list;
    g.replaceChildren();g.className="grid";bar.replaceChildren();
    if(sectioned){
      const base=CATS[page]||[],extra=[...new Set(list.map(i=>i.section).filter(Boolean))].filter(n=>!base.includes(n)),names=[...base,...extra];
      if(list.some(i=>!i.section))names.push("More");
      if(!names.includes(active))active=names.find(n=>slug(n)===hash())||names.find(n=>list.some(i=>(i.section||"More")===n))||names[0];
      tabs(bar,names,active,n=>{active=n;go(n);render()});
      its=list.filter(i=>(i.section||"More")===active).sort((a,b)=>a.created_at<b.created_at?-1:1)}
    if(admin){const b=el("button",{className:"plus",textContent:"+",ariaLabel:"추가"});b.onclick=()=>{form.hidden=!form.hidden;if(!form.hidden)form.fill()};g.append(b)}
    if(!form.hidden)form.fill();
    its.forEach(i=>g.append(card(i)));
    if(!its.length&&!admin)g.append(el("p",{className:"empty",textContent:"Coming soon"}));
    if(its.length&&its.every(i=>i.kind==="image"))g.classList.add("imgs");else if(its.length&&its.every(i=>i.kind!=="image"))g.classList.add("vids");
    if(tracks){
      tabs(topBar,["Tracks","Portfolio"],top,n=>{top=n;go(n);render()});
      tracks.hidden=top!=="Tracks";sec.hidden=top!=="Portfolio";main.classList.add("tabbed");
      if(top!=="Tracks")document.dispatchEvent(new Event("rif:pause"))}
    else sec.hidden=!sectioned&&!admin&&!list.length}
  async function load(){const {data}=await db.from("items").select("*").eq("page",page).order("created_at",{ascending:false});list=data||[];render()}
  load()})();
