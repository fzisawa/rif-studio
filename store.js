/* RIF STUDIO Official Store — 상품 목록 · 상세 · 장바구니 · 주문 접수 · 주문 조회
   가격·배송비·재고는 주문할 때 서버(store_order)가 다시 계산해요. 장바구니는 이 브라우저에만 저장돼요. */
(async()=>{
const root=document.getElementById("store");if(!root)return;
const T={
 ko:{plan:"Plan",goods:"Goods",all:"전체",soldout:"품절",cart:"장바구니",add:"장바구니 담기",buy:"구매하기",ask:"문의하기",ext:"스토어에서 구매",qty:"수량",ship:"배송비",free:"무료",freeOver:"원 이상 무료배송",total:"총 상품 금액",sub:"상품 금액",pay:"결제 예정 금액",empty:"장바구니가 비어 있어요.",order:"주문하기",remove:"삭제",choose:"선택",detail:"상세 정보",policy:"배송 · 교환 · 반품 안내",added:"장바구니에 담았어요.",opt:"옵션을 골라 주세요.",
  ckTitle:"주문서",name:"주문자 이름",email:"이메일",phone:"휴대폰 번호",zip:"우편번호",addr:"받는 주소",memo:"요청 사항 (선택)",agree:"주문 내용과 배송 · 교환 · 반품 안내, 개인정보 수집(주문 처리 목적)에 동의해요.",place:"주문 접수하기",back:"장바구니로",doneT:"주문이 접수됐어요",doneNo:"주문번호",doneMail:"주문번호를 이메일로 보내 드렸어요. 주문 조회에서 이름과 이메일만 넣으면 언제든 확인할 수 있어요.",keep:"쇼핑 계속하기",
  look:"주문 조회",lookBtn:"조회하기",noOrder:"주문을 찾지 못했어요. 주문할 때 쓴 이름과 이메일을 확인해 주세요.",st:{new:"접수됨 · 발송 준비 중",shipped:"발송함 · 결제 안내",paid:"결제 확인",done:"완료",cancel:"취소됨"},later:"결제는 상품을 받은 뒤에 해요(후불). 발송 후 주문 조회에서 입금 계좌와 PayPal 결제를 확인할 수 있어요.",laterKR:"결제는 상품을 받은 뒤에 해요(후불). 발송 후 주문 조회에서 입금 계좌를 확인할 수 있어요.",laterPP:"결제는 상품을 받은 뒤에 해요(후불). 발송 후 주문 조회에서 PayPal로 결제할 수 있어요.",
  closed:"지금은 판매 준비 중이에요. 곧 열어요!",soon:"Coming soon",planNote:"플랜은 배송 없이 작업으로 진행돼요.",err:"주문하지 못했어요: ",
  e:{"store closed":"지금은 주문을 받지 않아요.","bad email":"이메일 형식을 확인해 주세요.","bad phone":"휴대폰 번호를 확인해 주세요.","address required":"받는 주소와 우편번호를 적어 주세요.","name required":"이름을 적어 주세요.","too many":"잠시 뒤에 다시 시도해 주세요.","out of stock":"재고가 부족한 상품이 있어요","not for sale":"지금 살 수 없는 상품이 있어요","bad option":"옵션을 다시 골라 주세요"},biz:"사업자 정보",ppT:"해외 결제 (PayPal · 해외 카드)",ppAmt:"결제 금액",ppNote:"해외에 사는 손님 전용이에요. PayPal 정책상 한국 PayPal 계정·한국 카드로는 결제할 수 없어요. 한국에서는 위의 계좌 입금으로 결제해 주세요. (원화 금액을 고정 환율로 달러로 바꿔 결제해요)",ppOk:"결제가 완료됐어요. 고마워요!",ppErr:"결제를 마치지 못했어요. 다시 시도하거나 계좌 입금으로 진행해 주세요.",ppPaid:"PayPal로 결제 완료",ppGo:"결제 창이 안 열리면: PayPal 결제 페이지로 이동",ppCancel:"PayPal 결제를 취소했어요."},
 ja:{plan:"Plan",goods:"Goods",all:"すべて",soldout:"売り切れ",cart:"カート",add:"カートに入れる",buy:"購入する",ask:"お問い合わせ",ext:"ストアで購入",qty:"数量",ship:"送料",free:"無料",freeOver:"ウォン以上で送料無料",total:"商品合計",sub:"商品金額",pay:"お支払い予定額",empty:"カートは空です。",order:"注文する",remove:"削除",choose:"選択",detail:"詳細",policy:"配送・交換・返品について",added:"カートに入れました。",opt:"オプションを選んでください。",
  ckTitle:"ご注文",name:"お名前",email:"メールアドレス",phone:"電話番号",zip:"郵便番号",addr:"お届け先住所",memo:"ご要望（任意）",agree:"注文内容、配送・交換・返品について、個人情報の収集（注文処理のため）に同意します。",place:"注文を確定する",back:"カートに戻る",doneT:"ご注文を受け付けました",doneNo:"注文番号",doneMail:"注文番号をメールでお送りしました。注文照会でお名前とメールアドレスを入力すれば、いつでもご確認いただけます。",keep:"買い物を続ける",
  look:"注文照会",lookBtn:"照会する",noOrder:"注文が見つかりません。ご注文時のお名前とメールアドレスをご確認ください。",st:{new:"受付済み・発送準備中",shipped:"発送済み・お支払いのご案内",paid:"お支払い確認済み",done:"完了",cancel:"キャンセル"},later:"お支払いは商品をお受け取りいただいた後です（後払い）。発送後、注文照会でお振込先とPayPal決済をご確認いただけます。",laterKR:"お支払いは商品をお受け取りいただいた後です（後払い）。発送後、注文照会でお振込先をご確認いただけます。",laterPP:"お支払いは商品をお受け取りいただいた後です（後払い）。発送後、注文照会からPayPalでお支払いいただけます。",
  closed:"現在、販売準備中です。もうすぐオープン！",soon:"Coming soon",planNote:"プランは配送なしで制作として進みます。",err:"注文できませんでした: ",
  e:{"store closed":"現在、注文を受け付けていません。","bad email":"メールアドレスをご確認ください。","bad phone":"電話番号をご確認ください。","address required":"住所と郵便番号を入力してください。","name required":"お名前を入力してください。","too many":"しばらくしてから再度お試しください。","out of stock":"在庫が足りない商品があります","not for sale":"現在購入できない商品があります","bad option":"オプションを選び直してください"},biz:"事業者情報",ppT:"PayPal・カードですぐにお支払い",ppAmt:"お支払い金額",ppNote:"ウォン建ての金額を固定レートで米ドルに換算してお支払いいただきます。",ppOk:"お支払いが完了しました。ありがとうございます！",ppErr:"お支払いを完了できませんでした。もう一度お試しください。",ppPaid:"PayPalでお支払い済み",ppGo:"決済画面が開かない場合：PayPalのページへ移動",ppCancel:"PayPalでのお支払いをキャンセルしました。"},
 en:{plan:"Plan",goods:"Goods",all:"All",soldout:"Sold out",cart:"Cart",add:"Add to cart",buy:"Buy now",ask:"Ask us",ext:"Buy at store",qty:"Qty",ship:"Shipping",free:"Free",freeOver:" KRW+ ships free",total:"Items total",sub:"Items",pay:"Total due",empty:"Your cart is empty.",order:"Check out",remove:"Remove",choose:"Choose",detail:"Details",policy:"Shipping, exchanges & returns",added:"Added to your cart.",opt:"Please choose an option.",
  ckTitle:"Checkout",name:"Your name",email:"Email",phone:"Phone",zip:"Postal code",addr:"Shipping address",memo:"Notes (optional)",agree:"I agree to the order details, the shipping/exchange/return policy, and the collection of my information to process this order.",place:"Place order",back:"Back to cart",doneT:"Your order is in",doneNo:"Order number",doneMail:"We've emailed you your order number. You can check your order anytime in Order lookup with your name and email.",keep:"Keep shopping",
  look:"Order lookup",lookBtn:"Look up",noOrder:"We couldn't find an order. Please check the name and email you ordered with.",st:{new:"Received · preparing to ship",shipped:"Shipped · payment due",paid:"Payment confirmed",done:"Completed",cancel:"Cancelled"},later:"You pay after your order arrives (pay later). Once it ships, check Order lookup for bank details and PayPal.",laterKR:"You pay after your order arrives (pay later). Once it ships, check Order lookup for our bank details.",laterPP:"You pay after your order arrives (pay later). Once it ships, you can pay with PayPal from Order lookup.",
  closed:"The store is getting ready. Opening soon!",soon:"Coming soon",planNote:"Plans are delivered as work, with no shipping.",err:"We couldn't place your order: ",
  e:{"store closed":"We're not taking orders right now.","bad email":"Please check your email.","bad phone":"Please check your phone number.","address required":"Please enter your address and postal code.","name required":"Please enter your name.","too many":"Please try again in a moment.","out of stock":"An item is out of stock","not for sale":"An item isn't available right now","bad option":"Please choose the options again"},biz:"Business information",ppT:"Pay now with PayPal or card",ppAmt:"Amount",ppNote:"Your KRW total is converted to US dollars at a fixed rate.",ppOk:"Payment complete. Thank you so much!",ppErr:"We couldn't complete the payment. Please try again.",ppPaid:"Paid with PayPal",ppGo:"Window not opening? Go to the PayPal page",ppCancel:"PayPal payment was cancelled."}};
const lng=()=>{try{const v=localStorage.getItem("rif-lang");if(v==="ja"||v==="en")return v}catch(_){}return "ko"};
let L=lng(),t=T[L];
const won=n=>"₩"+Number(n||0).toLocaleString("ko-KR");
const nm=p=>(L==="ja"&&p.name_ja)||(L==="en"&&p.name_en)||p.name;
const dt=p=>(L==="ja"&&p.detail_ja)||(L==="en"&&p.detail_en)||p.detail||"";
const sm=p=>(L==="ja"&&p.summary_ja)||(L==="en"&&p.summary_en)||p.summary||"";
/* 옵션: 값마다 추가 금액(add), 일본어 · 영어 표기(ja/en). 주문에는 한국어 값을 보내고 금액은 서버에서 다시 계산해요 */
const oN=o=>(L!=="ko"&&o[L]&&o[L].name)||o.name,oV=(o,v)=>{const i=o.values.indexOf(v);return (L!=="ko"&&o[L]&&o[L].values&&o[L].values[i])||v};
const oAdd=(p,sel)=>(p.options||[]).reduce((a,o)=>a+Math.max(0,Number((o.add||{})[(sel||{})[o.name]])||0),0);
const oTxt=(p,sel)=>(p.options||[]).filter(o=>sel&&sel[o.name]).map(o=>oN(o)+": "+oV(o,sel[o.name])).join(" · ");
const unit=p=>p.sale_price!=null&&p.sale_price<p.price?p.sale_price:p.price;
const lines=s=>String(s||"").split("\n").flatMap((x,i)=>i?[el("br"),document.createTextNode(x)]:[document.createTextNode(x)]);
const KEY="rif-cart";
const getCart=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(v)?v:[]}catch(_){return []}};
const setCart=c=>{try{localStorage.setItem(KEY,JSON.stringify(c))}catch(_){}cartBadge()};
let P=[],S={},tab=null;

/* 화면 뼈대 */
const bar=el("div",{className:"tabs"}),grid=el("div",{className:"sgrid"}),note=el("p",{className:"snote",hidden:true});
const cartBtn=el("button",{type:"button",className:"scart",ariaLabel:"cart"},[el("span",{className:"sci"}),el("b",{className:"scn",textContent:"0"})]);
const lookBtn=el("button",{type:"button",className:"slook"});
const tools=el("div",{className:"stools"},[lookBtn,cartBtn]);
const biz=el("dl",{className:"sbiz",hidden:true});
root.replaceChildren(el("div",{className:"stop"},[bar,tools]),note,grid,biz);
const sheet=el("div",{className:"smod",hidden:true,role:"dialog",ariaModal:"true"}),panel=el("div",{className:"spanel"});sheet.append(panel);document.body.append(sheet);
const toast=el("div",{className:"stoast",role:"status",hidden:true});document.body.append(toast);
let tt=0;const say=m=>{toast.textContent=m;toast.hidden=false;clearTimeout(tt);tt=setTimeout(()=>toast.hidden=true,2200)};
let lastFocus=null;
function open(kind,...a){lastFocus=document.activeElement;panel.className="spanel "+kind;panel.replaceChildren();sheet.hidden=false;document.documentElement.classList.add("snoscroll");
  ({detail:drawDetail,cart:drawCart,check:drawCheck,done:drawDone,look:drawLook})[kind](...a);
  const f=panel.querySelector("button,select,input");if(f)f.focus({preventScroll:true})}
function close(){sheet.hidden=true;document.documentElement.classList.remove("snoscroll");if(/[?&]p=/.test(location.search))history.replaceState(null,"",location.pathname+location.hash);if(lastFocus&&lastFocus.focus)lastFocus.focus({preventScroll:true})}
sheet.onclick=e=>{if(e.target===sheet)close()};document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!sheet.hidden)close()});
const xBtn=()=>{const b=el("button",{type:"button",className:"sx",textContent:"×",ariaLabel:"close"});b.onclick=close;return b};
const priceEl=p=>{const u=unit(p),off=p.sale_price!=null&&p.sale_price<p.price;return el("div",{className:"spr"},[...(off?[el("em",{textContent:Math.round((1-p.sale_price/p.price)*100)+"%"}),el("s",{textContent:won(p.price)})]:[]),el("b",{textContent:won(u)+((p.options||[]).some(o=>o.add&&Object.values(o.add).some(Number))?" ~":"")})])};
function cartBadge(){const n=getCart().reduce((a,c)=>a+c.qty,0);cartBtn.querySelector(".scn").textContent=String(n);cartBtn.classList.toggle("has",n>0);cartBtn.setAttribute("aria-label",t.cart+" "+n)}
function labels(){lookBtn.textContent=t.look;cartBtn.title=t.cart;cartBadge()}

/* 목록 */
function draw(){
  const kinds=["plan","goods"].filter(k=>P.some(p=>p.kind===k));if(!kinds.includes(tab))tab=kinds[kinds.length>1&&location.hash==="#goods"?1:0]||null;
  bar.replaceChildren(...kinds.map(k=>{const b=el("button",{type:"button",className:"tab"+(k===tab?" on":""),textContent:t[k]});b.onclick=()=>{tab=k;history.replaceState(null,"","#"+k);draw()};return b}));
  note.hidden=!!S.open||!P.some(p=>p.buy_mode==="order");note.textContent=t.closed;
  const its=P.filter(p=>p.kind===tab);grid.replaceChildren();grid.className="sgrid"+(tab==="plan"?" plans":"");
  if(!its.length){grid.append(el("p",{className:"empty",textContent:t.soon}));return}
  its.forEach(p=>{const img=(p.images||[])[0],so=p.status==="soldout";
    const c=el("a",{className:"scard"+(so?" so":""),href:"?p="+p.id},[el("div",{className:"sth"},[img?el("img",{src:img,alt:"",loading:"lazy"}):el("span",{className:"sno",textContent:"RIF"}),...(so?[el("span",{className:"sbadge",textContent:t.soldout})]:[])]),
      el("div",{className:"sinfo"},[el("h3",{textContent:nm(p)}),...(sm(p)&&tab==="plan"?[el("p",{className:"ssum",textContent:sm(p)})]:[]),priceEl(p)])]);
    c.onclick=e=>{if(e.metaKey||e.ctrlKey)return;e.preventDefault();history.replaceState(null,"","?p="+p.id+location.hash);open("detail",p)};grid.append(c)});
  /* 사업자 정보 (어드민에서 채우면 보여요) */
  const B=S.biz||{},BL={ko:["상호","대표","사업자등록번호","통신판매업 신고","주소","연락처"],ja:["商号","代表者","事業者登録番号","通信販売業申告","所在地","連絡先"],en:["Business name","Representative","Business registration no.","Mail-order business report","Address","Contact"]}[L]||[],rows=[[BL[0],B.name],[BL[1],B.ceo],[BL[2],B.reg],[BL[3],B.mail_order],[BL[4],B.addr],[BL[5],B.contact]].filter(r=>r[1]);
  biz.hidden=!rows.length;biz.replaceChildren(...rows.flatMap(([k,v])=>[el("dt",{textContent:k}),el("dd",{textContent:v})]))}

/* 상세 */
function drawDetail(p){
  const imgs=(p.images||[]).length?p.images:[null];let cur=0;
  const big=el("div",{className:"sbig"}),thumbs=el("div",{className:"sthumbs"});
  const show=i=>{cur=i;big.replaceChildren(imgs[i]?el("img",{src:imgs[i],alt:nm(p)}):el("span",{className:"sno",textContent:"RIF"}));[...thumbs.children].forEach((b,j)=>b.classList.toggle("on",j===i))};
  if(imgs.length>1)imgs.forEach((u,i)=>{const b=el("button",{type:"button"},[el("img",{src:u,alt:"",loading:"lazy"})]);b.onclick=()=>show(i);thumbs.append(b)});
  const sels=(p.options||[]).map(o=>{const s=el("select",{},[el("option",{value:"",textContent:oN(o)+" "+t.choose}),...o.values.map(v=>{const a=Number((o.add||{})[v])||0;return el("option",{value:v,textContent:oV(o,v)+(a?" (+"+won(a)+")":"")})})]);s.dataset.n=o.name;s.setAttribute("aria-label",oN(o));return s});
  const picked=()=>{const o={};sels.forEach(s=>{if(s.value)o[s.dataset.n]=s.value});return o};
  let q=1;const qv=el("output",{textContent:"1"}),minus=el("button",{type:"button",textContent:"−",ariaLabel:"-"}),plus=el("button",{type:"button",textContent:"+",ariaLabel:"+"});
  const lim=Math.max(1,Math.min(p.max_qty||10,p.stock==null?999:p.stock));
  const sum=el("b",{className:"stot"});const upd=()=>{qv.textContent=String(q);sum.textContent=won((unit(p)+oAdd(p,picked()))*q);minus.disabled=q<=1;plus.disabled=q>=lim};
  minus.onclick=()=>{q=Math.max(1,q-1);upd()};plus.onclick=()=>{q=Math.min(lim,q+1);upd()};sels.forEach(s=>s.onchange=upd);upd();
  const opts=()=>{const o={};for(const s of sels){if(!s.value){s.focus();say(t.opt);return null}o[s.dataset.n]=s.value}return o};
  const so=p.status==="soldout",acts=el("div",{className:"sacts"});
  if(so)acts.append(el("button",{type:"button",className:"btn",disabled:true,textContent:t.soldout}));
  else if(p.buy_mode==="link"&&p.buy_url)acts.append(el("a",{className:"btn",href:p.buy_url,target:"_blank",rel:"noopener",textContent:t.ext+" ↗"}));
  else if(p.buy_mode==="inquiry")acts.append(el("a",{className:"btn",href:"../contact/",textContent:t.ask}));
  else{const a=el("button",{type:"button",className:"btn ghost",textContent:t.add}),b=el("button",{type:"button",className:"btn",textContent:t.buy});
    a.disabled=b.disabled=!S.open;
    const put=()=>{const o=opts();if(!o)return false;const c=getCart(),k=p.id+"|"+JSON.stringify(o),hit=c.find(x=>x.k===k);if(hit)hit.qty=Math.min(lim,hit.qty+q);else c.push({k,id:p.id,opts:o,qty:q});setCart(c);return true};
    a.onclick=()=>{if(put())say(t.added)};b.onclick=()=>{if(put())open("cart")};acts.append(a,b)}
  const ship=p.kind==="goods"?el("p",{className:"sship",textContent:t.ship+" "+(S.ship_fee?won(S.ship_fee):t.free)+(S.free_over?" · "+(L==="en"?won(S.free_over)+t.freeOver:Number(S.free_over).toLocaleString("ko-KR")+t.freeOver):"")}):el("p",{className:"sship",textContent:t.planNote});
  const buyBox=el("div",{className:"sbuy"},[el("p",{className:"tag",textContent:t[p.kind]}),el("h2",{textContent:nm(p)}),...(sm(p)?[el("p",{className:"ssum",textContent:sm(p)})]:[]),priceEl(p),ship,
    ...(so||p.buy_mode!=="order"?[]:[...sels,el("div",{className:"sqty"},[el("span",{textContent:t.qty}),el("div",{className:"sstep"},[minus,qv,plus])]),el("div",{className:"srow"},[el("span",{textContent:t.total}),sum])]),acts]);
  const more=el("div",{className:"smore"},[...(dt(p)?[el("h3",{textContent:t.detail}),el("p",{},lines(dt(p)))]:[]),...(S.policy?[el("details",{},[el("summary",{textContent:t.policy}),el("p",{},lines(S.policy))])]:[])]);
  panel.append(xBtn(),el("div",{className:"sdet"},[el("div",{className:"sgal"},[big,thumbs]),buyBox]),more);show(0)}

/* 장바구니 */
const itemsOf=()=>getCart().map(c=>({c,p:P.find(p=>p.id===c.id)})).filter(x=>x.p&&x.p.status==="sale"&&x.p.buy_mode==="order");
const money=its=>{const sub=its.reduce((a,x)=>a+(unit(x.p)+oAdd(x.p,x.c.opts))*x.c.qty,0),goods=its.some(x=>x.p.kind==="goods"),ship=goods?(S.free_over!=null&&sub>=S.free_over?0:S.ship_fee||0):0;return {sub,ship,total:sub+ship,goods}};
function drawCart(){
  const its=itemsOf();setCart(its.map(x=>x.c));
  panel.append(xBtn(),el("h2",{textContent:t.cart}));
  if(!its.length){panel.append(el("p",{className:"empty",textContent:t.empty}));return}
  const ul=el("ul",{className:"slines"});
  its.forEach(({c,p})=>{const lim=Math.max(1,Math.min(p.max_qty||10,p.stock==null?999:p.stock));
    const mi=el("button",{type:"button",textContent:"−",disabled:c.qty<=1}),pl=el("button",{type:"button",textContent:"+",disabled:c.qty>=lim}),rm=el("button",{type:"button",className:"srm",textContent:t.remove});
    const setQ=n=>{const all=getCart(),h=all.find(x=>x.k===c.k);if(h){h.qty=n;setCart(all)}open("cart")};
    mi.onclick=()=>setQ(c.qty-1);pl.onclick=()=>setQ(c.qty+1);rm.onclick=()=>{setCart(getCart().filter(x=>x.k!==c.k));open("cart")};
    const img=(p.images||[])[0];
    ul.append(el("li",{},[img?el("img",{src:img,alt:""}):el("span",{className:"sno",textContent:"RIF"}),el("div",{},[el("b",{textContent:nm(p)}),...(oTxt(p,c.opts)?[el("small",{textContent:oTxt(p,c.opts)})]:[]),el("div",{className:"sstep"},[mi,el("output",{textContent:String(c.qty)}),pl]),rm]),el("b",{className:"slp",textContent:won((unit(p)+oAdd(p,c.opts))*c.qty)})]))});
  const m=money(its);
  panel.append(ul,el("div",{className:"ssum2"},[el("div",{className:"srow"},[el("span",{textContent:t.sub}),el("span",{textContent:won(m.sub)})]),...(m.goods?[el("div",{className:"srow"},[el("span",{textContent:t.ship}),el("span",{textContent:m.ship?won(m.ship):t.free})])]:[]),el("div",{className:"srow big"},[el("span",{textContent:t.pay}),el("b",{textContent:won(m.total)})])]));
  const go=el("button",{type:"button",className:"btn wide",textContent:t.order,disabled:!S.open});go.onclick=()=>open("check");panel.append(go);if(!S.open)panel.append(el("p",{className:"note",textContent:t.closed}))}

/* 주문서 */
function drawCheck(){
  const its=itemsOf();if(!its.length){open("cart");return}const m=money(its);
  const f=(id,lab,type,req,ac)=>el("label",{},[el("span",{textContent:lab}),el("input",{id,type:type||"text",required:!!req,autocomplete:ac||"off",maxLength:type==="email"?120:200})]);
  const form=el("form",{className:"sform"},[f("sname",t.name,"text",1,"name"),f("semail",t.email,"email",1,"email"),f("sphone",t.phone,"tel",1,"tel"),
    ...(m.goods?[f("szip",t.zip,"text",1,"postal-code"),f("saddr",t.addr,"text",1,"street-address")]:[]),
    el("label",{},[el("span",{textContent:t.memo}),el("textarea",{id:"smemo",rows:2,maxLength:500})]),
    el("label",{className:"sagree"},[el("input",{type:"checkbox",id:"sagr",required:true}),el("span",{textContent:t.agree})]),
    el("div",{className:"srow big"},[el("span",{textContent:t.pay}),el("b",{textContent:won(m.total)})]),
    el("p",{className:"note err",id:"serr",hidden:true}),
    el("div",{className:"wr"},[el("button",{type:"button",className:"btn ghost",id:"sback",textContent:t.back}),el("button",{className:"btn",id:"sgo",textContent:t.place})])]);
  panel.append(xBtn(),el("h2",{textContent:t.ckTitle}),form);
  form.querySelector("#sback").onclick=()=>open("cart");
  form.onsubmit=async e=>{e.preventDefault();const g=i=>{const x=form.querySelector("#"+i);return x?x.value.trim():""},er=form.querySelector("#serr"),b=form.querySelector("#sgo");
    b.disabled=true;er.hidden=true;
    const cc=await myCC().catch(()=>"");const {data,error}=await db.rpc("store_order",{p:{cc,lang:L,name:g("sname"),email:g("semail"),phone:g("sphone"),zip:g("szip"),addr:g("saddr"),memo:g("smemo"),items:its.map(x=>({id:x.p.id,qty:x.c.qty,opts:x.c.opts}))}});
    b.disabled=false;
    if(error){const m2=String(error.message||""),k=Object.keys(t.e).find(k=>m2.includes(k));er.textContent=t.err+(k?t.e[k]+(m2.includes(":")&&/stock|sale|option/.test(k)?" ("+m2.split(":").slice(1).join(":").trim()+")":""):m2);er.hidden=false;if(/stock|sale/.test(m2))load();return}
    setCart([]);lookName=g("sname");/* 주문 확인 메일 (주문번호 안내) */db.functions.invoke("store-order-mail",{body:{no:data.no,email:g("semail"),lang:L}}).catch(()=>{});open("done",data,g("semail"))}}

/* 완료 · 조회 */
/* PayPal 결제 — 금액은 서버(paypal-pay)가 주문에서 다시 계산하고, 결제 확인도 서버가 PayPal 에 직접 물어봐요 */
let ppCfg=null,ppSdk=null;
const PPTEST=(()=>{let on=/[?&]pptest/.test(location.search);try{if(on)sessionStorage.setItem("rif_pptest","1");else on=sessionStorage.getItem("rif_pptest")==="1"}catch(_){}return on})();
const ppCall=async b=>{const {data,error}=await db.functions.invoke("paypal-pay",{body:b});if(error){let m="";try{m=(await error.context.json()).error}catch(_){}throw new Error(m||error.message)}return data};
const ppLoad=c=>ppSdk||(ppSdk=new Promise((ok,no)=>{const sc=document.createElement("script");sc.src="https://www.paypal.com/sdk/js?client-id="+encodeURIComponent(c.client)+"&currency="+c.currency+"&intent=capture&components=buttons";sc.onload=()=>ok(window.paypal);sc.onerror=()=>{ppSdk=null;no(new Error("sdk"))};document.head.append(sc)}));
/* 접속 나라: 한국 IP → 계좌 입금만, 해외 IP → PayPal만, 확인 못 하면 둘 다 (이 탭에서 한 번만 확인) */
let ccP=null;
const myCC=()=>ccP||(ccP=(async()=>{try{const c=sessionStorage.getItem("rif_cc");if(c)return c}catch(_){}
  const ask=(u,pick)=>{const c=new AbortController(),tm=setTimeout(()=>c.abort(),2500);return fetch(u,{signal:c.signal,cache:"no-store"}).then(r=>{if(!r.ok)throw 0;return r.text()}).then(pick).finally(()=>clearTimeout(tm))};
  let cc="";try{cc=await ask("https://api.country.is/",x=>JSON.parse(x).country)}catch(_){try{cc=await ask("https://ipapi.co/country/",x=>x.trim().slice(0,2))}catch(_){}}
  cc=/^[A-Za-z]{2}$/.test(cc||"")?cc.toUpperCase():"";if(cc)try{sessionStorage.setItem("rif_cc",cc)}catch(_){}return cc})());
function laterBox(){const p=el("p",{textContent:t.later});myCC().then(cc=>{if(cc==="KR")p.textContent=t.laterKR;else if(cc)p.textContent=t.laterPP});return el("div",{className:"sguide"},[p])}
function payArea(no,mail,guide,after){const w=el("div",{className:"spay"});
  myCC().then(cc=>{const kr=cc==="KR",abroad=!!cc&&!kr;
    if(!abroad&&guide)w.append(el("div",{className:"sguide"},lines(guide)));
    if(!kr)w.append(ppBox(no,mail,after))});return w}
const ppLog=m=>{try{ppCall({action:"log",msg:String(m)})}catch(_){}};
/* 결제 창(팝업)이 막히는 브라우저를 위해: PayPal 결제 페이지로 이동했다가 돌아오는 방식도 함께 둬요 (주문번호·이메일은 주소가 아니라 이 탭에만 잠깐 보관) */
async function ppGo(no,mail,btn,msg){btn.disabled=true;try{const r=await ppCall({action:"create",no,email:mail,redirect:true});if(!r.link)throw new Error("no link");
  try{sessionStorage.setItem("rif_pp",JSON.stringify({no,email:mail,id:r.id,name:lookName}))}catch(_){}location.href=r.link}catch(e){btn.disabled=false;msg.className="note err";msg.textContent=t.ppErr;ppLog("redirect create: "+(e&&e.message))}}
function ppBox(no,mail,after){const box=el("div",{className:"spp",hidden:true});if(!no||!mail)return box;
  (async()=>{try{ppCfg=ppCfg||await ppCall({action:"config"});if(!ppCfg.on)return;
    /* 테스트(sandbox) 중에는 주소 끝에 ?pptest 를 붙인 사람에게만 보여요 — 손님이 가짜 돈으로 결제하지 않게 */
    if(ppCfg.env!=="live"&&!PPTEST)return;
    const q=await ppCall({action:"quote",no,email:mail});
    const msg=el("p",{className:"note",textContent:t.ppNote}),btns=el("div",{className:"sppb"});
    const go=el("button",{type:"button",className:"btn ghost sppgo",textContent:t.ppGo});go.onclick=()=>ppGo(no,mail,go,msg);
    box.append(el("b",{className:"sppt",textContent:t.ppT}),el("div",{className:"srow"},[el("span",{textContent:t.ppAmt}),el("b",{textContent:"US$ "+q.amount})]),btns,go,msg);box.hidden=false;
    const done=()=>{btns.replaceChildren();go.remove();const r=box.querySelector(".srow");if(r)r.remove();msg.className="note ok";msg.textContent=t.ppOk;panel.querySelectorAll(".sguide").forEach(x=>x.remove());if(after)after()};
    let pp=null;try{pp=await ppLoad(ppCfg)}catch(e){ppLog("sdk load: "+(e&&e.message));return}
    try{await pp.Buttons({style:{layout:"vertical",shape:"pill",label:"pay",height:44},
      createOrder:async()=>{try{return (await ppCall({action:"create",no,email:mail})).id}catch(e){ppLog("create: "+(e&&e.message));throw e}},
      onApprove:async d=>{try{await ppCall({action:"capture",no,email:mail,id:d.orderID});done()}catch(e){msg.className="note err";msg.textContent=t.ppErr;ppLog("capture: "+(e&&e.message))}},
      onError:e=>{msg.className="note err";msg.textContent=t.ppErr;ppLog("sdk: "+(e&&(e.message||e)))}}).render(btns)}catch(e){btns.remove();ppLog("render: "+(e&&e.message))}
  }catch(e){console.warn("paypal",e&&e.message)}})();
  return box}
/* PayPal 결제 페이지에서 돌아왔을 때: 결제 확정 후 주문 조회 화면으로 */
async function ppReturn(){const u=new URLSearchParams(location.search),r=u.get("ppret");if(r==null)return;
  let s={};try{s=JSON.parse(sessionStorage.getItem("rif_pp")||"{}")}catch(_){}
  history.replaceState(null,"",location.pathname+location.hash);
  if(r!=="1"||!s.no){if(s.no)say(t.ppCancel);return}
  try{await ppCall({action:"capture",no:s.no,email:s.email,id:u.get("token")||s.id});try{sessionStorage.removeItem("rif_pp")}catch(_){}say(t.ppOk)}catch(e){say(t.ppErr);ppLog("return capture: "+(e&&e.message))}
  open("look",{name:s.name||"",email:s.email})}
function drawDone(d,mail){
  panel.append(xBtn(),el("p",{className:"tag",textContent:"THANK YOU"}),el("h2",{textContent:t.doneT}),el("div",{className:"sno2"},[el("span",{textContent:t.doneNo}),el("b",{textContent:d.no})]),
    el("div",{className:"srow big"},[el("span",{textContent:t.pay}),el("b",{textContent:won(d.total)})]),/* 후불: 주문 완료 때는 결제 안내만, 결제는 발송 후 주문 조회에서 */laterBox(),
    el("p",{className:"note",textContent:t.doneMail}),(()=>{const b=el("button",{type:"button",className:"btn",textContent:t.keep});b.onclick=close;return b})())}
let lookName="";
function orderCard(data,mail,name,refresh){const d=new Date(data.created_at);
  return el("div",{className:"slcard"},[el("div",{className:"slhd"},[el("b",{textContent:t.doneNo+" "+data.no}),el("span",{className:"note",textContent:isNaN(d)?"":d.toLocaleDateString(L==="ko"?"ko-KR":L==="ja"?"ja-JP":"en-US")})]),
    el("div",{className:"sstat "+data.status,textContent:t.st[data.status]||data.status}),
    el("ul",{className:"slines sm"},(data.items||[]).map(i=>el("li",{},[el("div",{},[el("b",{textContent:i.name}),...(Object.keys(i.opts||{}).length?[el("small",{textContent:Object.entries(i.opts).map(([k,v])=>k+": "+v).join(" · ")})]:[]),el("small",{textContent:"× "+i.qty})]),el("b",{className:"slp",textContent:won(i.unit*i.qty)})]))),
    el("div",{className:"srow big"},[el("span",{textContent:t.pay}),el("b",{textContent:won(data.total)})]),...(data.status==="new"?[laterBox()]:[]),/* 후불: 발송한 주문만 결제 — 한국 IP는 계좌 입금, 해외 IP는 PayPal */...(data.status==="shipped"?[payArea(data.no,mail,data.pay_guide,refresh)]:[])])}
/* 주문 조회: 주문자 이름 + 이메일 → 그 사람의 주문 전부 (최근 20건) */
function drawLook(pre){
  const nm=el("input",{maxLength:40,autocomplete:"name",value:(pre&&pre.name)||lookName}),em=el("input",{type:"email",placeholder:t.email,maxLength:120,autocomplete:"email",value:(pre&&pre.email)||""}),out=el("div",{className:"slout"});
  const b=el("button",{className:"btn",textContent:t.lookBtn});
  const form=el("form",{className:"sform"},[el("label",{},[el("span",{textContent:t.name}),nm]),el("label",{},[el("span",{textContent:t.email}),em]),b]);
  form.onsubmit=async e=>{e.preventDefault();out.replaceChildren();b.disabled=true;lookName=nm.value.trim();const {data}=await db.rpc("store_lookup2",{p_name:nm.value,p_email:em.value});b.disabled=false;
    if(!data||!data.length){out.append(el("p",{className:"note err",textContent:t.noOrder}));return}
    out.replaceChildren(...data.map(o=>orderCard(o,em.value.trim(),nm.value.trim(),()=>form.requestSubmit())))};
  panel.append(xBtn(),el("h2",{textContent:t.look}),form,out);
  if(pre&&pre.name&&pre.email)setTimeout(()=>form.requestSubmit(),0)}
cartBtn.onclick=()=>open("cart");lookBtn.onclick=()=>open("look");

async function load(){
  const [a,b]=await Promise.all([db.from("store_products").select("*").neq("status","draft").order("sort").order("created_at",{ascending:false}),db.from("store_settings").select("*").eq("id",1).maybeSingle()]);
  P=(a.data||[]).filter(p=>p.status!=="draft");S=(b&&b.data)||{};draw();cartBadge();
  const id=new URLSearchParams(location.search).get("p"),p=id&&P.find(x=>x.id===id);if(p&&sheet.hidden)open("detail",p)}
document.addEventListener("rif:lang",()=>{L=lng();t=T[L];labels();draw();if(!sheet.hidden)close()});
labels();load().then(ppReturn)})();
