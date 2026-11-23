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
/* 패키지(플랜) 화면 문구 */
Object.assign(T.ko,{prev:"대표님에게만 보이는 미리보기예요. 손님에게는 아직 Coming soon으로 보여요.",draft:"비공개",view:"자세히 보기",listp:"정가",first:n=>"선착순 "+n+"건",left:n=>n+"건 남음",inc:"구성",team:"만드는 사람들",teamNote:"담당을 고를 수 있는 파트는 작업을 보고 직접 골라 주세요.",flow:"진행 순서",roles:{mix:"믹싱",art:"일러스트",video:"영상",direct:"디렉팅"},pick:"이 담당으로 선택",picked:"선택됨",folio:"포트폴리오 전체 보기",play:"재생",payLater:"결제는 결과물을 받은 뒤에 해요.",askPre:"주문 전에 궁금한 점이 있나요?",
  steps:[["주문 접수","지금은 결제하지 않아요. 이름과 연락처만 남겨 주세요."],["디렉팅","리후가 연락드려 곡과 방향을 함께 정해요."],["제작","믹싱 · 일러스트 · 영상을 만들어요."],["납품과 결제","결과물을 받은 뒤에 결제해요. 국내는 계좌 입금, 해외는 PayPal이에요."]]});
Object.assign(T.ja,{prev:"代表だけに見えるプレビューです。お客様にはまだ Coming soon と表示されます。",draft:"非公開",view:"詳しく見る",listp:"通常価格",first:n=>"先着"+n+"件",left:n=>"残り"+n+"件",inc:"セット内容",team:"制作メンバー",teamNote:"担当を選べるパートは、作品を見てお選びください。",flow:"ご利用の流れ",roles:{mix:"ミックス",art:"イラスト",video:"映像",direct:"ディレクション"},pick:"この担当を選ぶ",picked:"選択中",folio:"ポートフォリオをすべて見る",play:"再生",payLater:"お支払いは納品後です。",askPre:"ご注文前にご質問はありますか？",
  steps:[["ご注文","この時点ではお支払いは不要です。お名前とご連絡先だけご入力ください。"],["ディレクション","RIFからご連絡し、曲と方向性を一緒に決めます。"],["制作","ミックス・イラスト・映像を制作します。"],["納品とお支払い","納品後にお支払いください。海外からはPayPalをご利用いただけます。"]]});
Object.assign(T.en,{prev:"Preview: only the CEO account can see this. Customers still see “Coming soon.”",draft:"Hidden",view:"See details",listp:"Regular price",first:n=>"First "+n+" orders",left:n=>n+" left",inc:"What's included",team:"Who makes it",teamNote:"Where you have a choice, look through their work and pick your creator.",flow:"How it works",roles:{mix:"Mixing",art:"Illustration",video:"Video",direct:"Directing"},pick:"Choose this creator",picked:"Selected",folio:"See full portfolio",play:"Play",payLater:"You pay after you receive the finished work.",askPre:"Questions before you order?",
  steps:[["Place your order","No payment yet. Just leave your name and contact details."],["Directing","RIF gets in touch and settles the song and direction with you."],["Production","We make the mix, illustration and video."],["Delivery and payment","Pay once you have the finished work. From outside Korea, pay with PayPal."]]});
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
/* 세일: 할인가가 있고 세일 기간(시작~종료) 안일 때만 할인가를 받아요. 서버(store_unit)도 같은 규칙으로 계산해요 */
let ME=null;/* 로그인한 회원 (fan_me 결과). 없으면 비회원 */
const saleWin=p=>p.sale_price!=null&&p.sale_price<p.price&&(!p.sale_from||Date.now()>=Date.parse(p.sale_from))&&(!p.sale_until||Date.now()<Date.parse(p.sale_until));
const saleOn=p=>saleWin(p)&&(!p.sale_members||!!ME),memberDeal=p=>!ME&&!!p.sale_members&&saleWin(p);
const unit=p=>saleOn(p)?p.sale_price:p.price;
const SX={ko:{until:d=>d+"까지",left:n=>n<=0?"오늘 마감":"D-"+n,cp:"쿠폰 코드",cpGo:"적용",cpOff:"쿠폰 할인",cpX:"빼기",
  ce:{"bad coupon":"쿠폰 코드를 확인해 주세요.","coupon expired":"사용 기간이 아닌 쿠폰이에요.","coupon used up":"선착순이 끝난 쿠폰이에요.","coupon not for these items":"이 상품에는 쓸 수 없는 쿠폰이에요.","coupon min":"주문 금액이 쿠폰 최소 금액보다 적어요.","coupon members only":"회원 전용 쿠폰이에요. 로그인한 뒤 써 주세요."}},
 ja:{until:d=>d+"まで",left:n=>n<=0?"本日終了":"あと"+n+"日",cp:"クーポンコード",cpGo:"適用",cpOff:"クーポン割引",cpX:"外す",
  ce:{"bad coupon":"クーポンコードをご確認ください。","coupon expired":"ご利用期間外のクーポンです。","coupon used up":"先着分が終了したクーポンです。","coupon not for these items":"この商品には使えないクーポンです。","coupon min":"ご注文金額がクーポンの最低金額に届いていません。","coupon members only":"会員限定のクーポンです。ログインしてご利用ください。"}},
 en:{until:d=>"Until "+d,left:n=>n<=0?"Ends today":n+(n===1?" day left":" days left"),cp:"Coupon code",cpGo:"Apply",cpOff:"Coupon",cpX:"Remove",
  ce:{"bad coupon":"Please check the coupon code.","coupon expired":"This coupon isn't valid right now.","coupon used up":"This coupon has been fully claimed.","coupon not for these items":"This coupon can't be used for these items.","coupon min":"Your order is below this coupon's minimum.","coupon members only":"This coupon is for members. Please log in to use it."}}};
const sx=()=>SX[L]||SX.ko;
/* 세일 안내 한 줄: 라벨(예: 런칭 특가) · 종료일 · 남은 날 */
const saleNote=p=>{if(memberDeal(p))return el("small",{className:"ssale",textContent:ax().mprice(won(p.sale_price))});if(!saleOn(p))return null;const lb=p.sale_label?(typeof p.sale_label==="string"?p.sale_label:(p.sale_label[L]||p.sale_label.ko||"")):"",parts=[];if(p.sale_members)parts.push(ax().monly);if(lb)parts.push(lb);
  if(p.sale_until){const d=new Date(p.sale_until),n=Math.floor((d-Date.now())/864e5);parts.push(sx().until(d.toLocaleDateString(L==="ko"?"ko-KR":L==="ja"?"ja-JP":"en-US",{month:"numeric",day:"numeric"})),sx().left(n))}
  return parts.length?el("small",{className:"ssale",textContent:parts.join(" · ")}):null};
document.head.append(Object.assign(document.createElement("style"),{textContent:".ssale{display:inline-block;margin-top:4px;padding:2px 9px;border-radius:99px;background:color-mix(in srgb,var(--ac) 16%,transparent);color:var(--ac);font-size:12px;font-weight:700;letter-spacing:0}.spr .ssale{flex-basis:100%;width:max-content}.scp{display:flex;gap:8px;align-items:center}.scp input{flex:1;min-width:0;text-transform:uppercase}.scp .btn{white-space:nowrap}.srow.off span,.srow.off b{color:var(--ac)}.sacct .stabs{display:flex;gap:6px;margin:14px 0}.sacct .stabs button{flex:1;padding:9px 6px;border:1px solid #7776;border-radius:99px;background:none;color:var(--fg);font:inherit;font-size:13px;cursor:pointer}.sacct .stabs button[aria-pressed=true]{background:var(--ac);border-color:var(--ac);color:#fff}.sptbox{display:flex;justify-content:space-between;align-items:baseline;padding:14px 16px;border-radius:14px;background:color-mix(in srgb,var(--ac) 12%,transparent)}.sptbox b{font-size:22px;font-variant-numeric:tabular-nums}.sptl{list-style:none;margin:0;padding:0}.sptl li{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid #7773;font-size:14px}.sptl small{display:block;color:var(--mut);font-size:12px}.sptl b.m{color:var(--mut)}.slinks{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;font-size:13px}.slinks button{background:none;border:0;color:var(--mut);font:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer;padding:4px}.sagree2{display:flex!important;flex-direction:row!important;gap:8px;align-items:flex-start;font-size:13px}.sagree2 input{width:auto!important;margin-top:3px}.spriv{font-size:12px;color:var(--mut);white-space:pre-line}.soauth{display:flex;flex-direction:column;gap:8px}.sor{text-align:center;color:var(--mut);font-size:12px}.saddrb{display:flex;flex-direction:column;gap:8px}.saddrb input{width:100%;padding:11px 14px;border:1px solid #7776;border-radius:12px;background:var(--bg);color:var(--fg);font:inherit;font-size:14px}.saddrb .scp input{flex:1}"}));
const lines=s=>String(s||"").split("\n").flatMap((x,i)=>i?[el("br"),document.createTextNode(x)]:[document.createTextNode(x)]);
const KEY="rif-cart";
const getCart=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(v)?v:[]}catch(_){return []}};
const setCart=c=>{try{localStorage.setItem(KEY,JSON.stringify(c))}catch(_){}cartBadge()};
let P=[],S={},tab=null,PREV=false,IT={};

/* 화면 뼈대 */
const bar=el("div",{className:"tabs"}),grid=el("div",{className:"sgrid"}),note=el("p",{className:"snote",hidden:true});
const cartBtn=el("button",{type:"button",className:"scart",ariaLabel:"cart"},[el("span",{className:"sci"}),el("b",{className:"scn",textContent:"0"})]);
const lookBtn=el("button",{type:"button",className:"slook"});
const acctBtn=el("button",{type:"button",className:"slook"});
const tools=el("div",{className:"stools"},[acctBtn,lookBtn,cartBtn]);
const biz=el("dl",{className:"sbiz",hidden:true}),prev=el("p",{className:"sprev",hidden:true});
root.replaceChildren(prev,el("div",{className:"stop"},[bar,tools]),note,grid,biz);
const sheet=el("div",{className:"smod",hidden:true,role:"dialog",ariaModal:"true"}),panel=el("div",{className:"spanel"});sheet.append(panel);document.body.append(sheet);
const toast=el("div",{className:"stoast",role:"status",hidden:true});document.body.append(toast);
/* 작품 사진 크게 보기 */
const lb=el("div",{className:"pklb",hidden:true});document.body.append(lb);lb.onclick=()=>{lb.hidden=true;lb.replaceChildren()};
const zoom=u=>{lb.replaceChildren(el("img",{src:u,alt:""}));lb.hidden=false};
let tt=0;const say=m=>{toast.textContent=m;toast.hidden=false;clearTimeout(tt);tt=setTimeout(()=>toast.hidden=true,2200)};
let lastFocus=null;
function open(kind,...a){lastFocus=document.activeElement;panel.className="spanel "+kind;panel.replaceChildren();sheet.hidden=false;document.documentElement.classList.add("snoscroll");
  ({detail:drawDetail,cart:drawCart,check:drawCheck,done:drawDone,look:drawLook,acct:drawAcct})[kind](...a);
  const f=panel.querySelector("button,select,input");if(f)f.focus({preventScroll:true})}
function close(){sheet.hidden=true;panel.replaceChildren();/* 재생 중인 영상 · 음원도 같이 멈춰요 */document.documentElement.classList.remove("snoscroll");if(/[?&]p=/.test(location.search))history.replaceState(null,"",location.pathname+location.hash);if(lastFocus&&lastFocus.focus)lastFocus.focus({preventScroll:true})}
sheet.onclick=e=>{if(e.target===sheet)close()};document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;if(!lb.hidden)lb.click();else if(!sheet.hidden)close()});
const xBtn=()=>{const b=el("button",{type:"button",className:"sx",textContent:"×",ariaLabel:"close"});b.onclick=close;return b};
const priceEl=p=>{const u=unit(p),off=saleOn(p),sn=saleNote(p);return el("div",{className:"spr"},[...(off?[el("em",{textContent:Math.round((1-p.sale_price/p.price)*100)+"%"}),el("s",{textContent:won(p.price)})]:[]),el("b",{textContent:won(u)+((p.options||[]).some(o=>o.add&&Object.values(o.add).some(Number))?" ~":"")}),...(sn?[sn]:[])])};
function cartBadge(){const n=getCart().reduce((a,c)=>a+c.qty,0);cartBtn.querySelector(".scn").textContent=String(n);cartBtn.classList.toggle("has",n>0);cartBtn.setAttribute("aria-label",t.cart+" "+n)}
function labels(){acctBtn.textContent=ME?(ME.nick||ax().my):ax().login;lookBtn.textContent=t.look;cartBtn.title=t.cart;cartBadge()}

/* 목록 */
function draw(){
  const kinds=["plan","goods"].filter(k=>P.some(p=>p.kind===k));if(!kinds.includes(tab))tab=kinds[kinds.length>1&&location.hash==="#goods"?1:0]||null;
  bar.replaceChildren(...kinds.map(k=>{const b=el("button",{type:"button",className:"tab"+(k===tab?" on":""),textContent:t[k]});b.onclick=()=>{tab=k;history.replaceState(null,"","#"+k);draw()};return b}));
  prev.hidden=!PREV;prev.textContent=t.prev;
  note.hidden=!!S.open||!P.some(p=>p.buy_mode==="order"&&p.status!=="draft");note.textContent=t.closed;
  const its=P.filter(p=>p.kind===tab);grid.replaceChildren();grid.className="sgrid"+(tab==="plan"?" plans":"");
  if(!its.length){grid.append(el("p",{className:"empty",textContent:t.soon}));return}
  its.forEach(p=>{const img=(p.images||[])[0],so=p.status==="soldout";
    const c=isPack(p)?packCard(p):el("a",{className:"scard"+(so?" so":""),href:"?p="+p.id},[el("div",{className:"sth"},[img?el("img",{src:img,alt:"",loading:"lazy"}):el("span",{className:"sno",textContent:"RIF"}),...(so?[el("span",{className:"sbadge",textContent:t.soldout})]:[]),...(p.status==="draft"?[el("span",{className:"pkd",textContent:t.draft})]:[])]),
      el("div",{className:"sinfo"},[el("h3",{textContent:nm(p)}),...(sm(p)&&tab==="plan"?[el("p",{className:"ssum",textContent:sm(p)})]:[]),priceEl(p)])]);
    c.onclick=e=>{if(e.metaKey||e.ctrlKey)return;e.preventDefault();history.replaceState(null,"","?p="+p.id+location.hash);open("detail",p)};grid.append(c)});
  /* 사업자 정보 (어드민에서 채우면 보여요) */
  const B=S.biz||{},BL={ko:["상호","대표","사업자등록번호","통신판매업 신고","주소","연락처"],ja:["商号","代表者","事業者登録番号","通信販売業申告","所在地","連絡先"],en:["Business name","Representative","Business registration no.","Mail-order business report","Address","Contact"]}[L]||[],rows=[[BL[0],B.name],[BL[1],B.ceo],[BL[2],B.reg],[BL[3],B.mail_order],[BL[4],B.addr],[BL[5],B.contact]].filter(r=>r[1]);
  biz.hidden=!rows.length;biz.replaceChildren(...rows.flatMap(([k,v])=>[el("dt",{textContent:k}),el("dd",{textContent:v})]))}

/* 구매 조작부: 옵션 · 수량 · 합계 · 버튼 (일반 상세와 패키지 상세가 같이 써요) */
function buyUI(p){
  const sels=(p.options||[]).map(o=>{const s=el("select",{},[el("option",{value:"",textContent:oN(o)+" "+t.choose}),...o.values.map(v=>{const a=Number((o.add||{})[v])||0;return el("option",{value:v,textContent:oV(o,v)+(a?" (+"+won(a)+")":"")})})]);s.dataset.n=o.name;s.setAttribute("aria-label",oN(o));return s});
  const picked=()=>{const o={};sels.forEach(s=>{if(s.value)o[s.dataset.n]=s.value});return o};
  let q=1;const qv=el("output",{textContent:"1"}),minus=el("button",{type:"button",textContent:"−",ariaLabel:"-"}),plus=el("button",{type:"button",textContent:"+",ariaLabel:"+"});
  const lim=Math.max(1,Math.min(p.max_qty||10,p.stock==null?999:p.stock));
  const sum=el("b",{className:"stot"});const upd=()=>{qv.textContent=String(q);sum.textContent=won((unit(p)+oAdd(p,picked()))*q);minus.disabled=q<=1;plus.disabled=q>=lim};
  minus.onclick=()=>{q=Math.max(1,q-1);upd()};plus.onclick=()=>{q=Math.min(lim,q+1);upd()};sels.forEach(s=>s.addEventListener("change",upd));upd();
  const opts=()=>{const o={};for(const s of sels){if(!s.value){s.focus();say(t.opt);return null}o[s.dataset.n]=s.value}return o};
  const so=p.status==="soldout",acts=el("div",{className:"sacts"}),live=!!S.open&&p.status==="sale";let buy=null;
  if(so)acts.append(el("button",{type:"button",className:"btn",disabled:true,textContent:t.soldout}));
  else if(p.buy_mode==="link"&&p.buy_url)acts.append(el("a",{className:"btn",href:p.buy_url,target:"_blank",rel:"noopener",textContent:t.ext+" ↗"}));
  else if(p.buy_mode==="inquiry")acts.append(el("a",{className:"btn",href:"../contact/",textContent:t.ask}));
  else{const a=el("button",{type:"button",className:"btn ghost",textContent:t.add}),b=el("button",{type:"button",className:"btn",textContent:t.buy});
    a.disabled=b.disabled=!live;
    const put=()=>{const o=opts();if(!o)return false;const c=getCart(),k=p.id+"|"+JSON.stringify(o),hit=c.find(x=>x.k===k);if(hit)hit.qty=Math.min(lim,hit.qty+q);else c.push({k,id:p.id,opts:o,qty:q});setCart(c);return true};
    buy=()=>{if(put())open("cart")};a.onclick=()=>{if(put())say(t.added)};b.onclick=buy;acts.append(a,b)}
  return {sels,so,lim,acts,live,buy,canOrder:!so&&p.buy_mode==="order",
    qty:el("div",{className:"sqty"},[el("span",{textContent:t.qty}),el("div",{className:"sstep"},[minus,qv,plus])]),tot:el("div",{className:"srow"},[el("span",{textContent:t.total}),sum])}}

/* 상세 */
function drawDetail(p){
  if(isPack(p))return drawPack(p);
  const imgs=(p.images||[]).length?p.images:[null];
  const big=el("div",{className:"sbig"}),thumbs=el("div",{className:"sthumbs"});
  const show=i=>{big.replaceChildren(imgs[i]?el("img",{src:imgs[i],alt:nm(p)}):el("span",{className:"sno",textContent:"RIF"}));[...thumbs.children].forEach((b,j)=>b.classList.toggle("on",j===i))};
  if(imgs.length>1)imgs.forEach((u,i)=>{const b=el("button",{type:"button"},[el("img",{src:u,alt:"",loading:"lazy"})]);b.onclick=()=>show(i);thumbs.append(b)});
  const U=buyUI(p);
  const ship=p.kind==="goods"?el("p",{className:"sship",textContent:t.ship+" "+(S.ship_fee?won(S.ship_fee):t.free)+(S.free_over?" · "+(L==="en"?won(S.free_over)+t.freeOver:Number(S.free_over).toLocaleString("ko-KR")+t.freeOver):"")}):el("p",{className:"sship",textContent:t.planNote});
  const buyBox=el("div",{className:"sbuy"},[el("p",{className:"tag",textContent:t[p.kind]}),el("h2",{textContent:nm(p)}),...(sm(p)?[el("p",{className:"ssum",textContent:sm(p)})]:[]),priceEl(p),ship,
    ...(U.canOrder?[...U.sels,U.qty,U.tot]:[]),U.acts]);
  const more=el("div",{className:"smore"},[...(dt(p)?[el("h3",{textContent:t.detail}),el("p",{},lines(dt(p)))]:[]),...(S.policy?[el("details",{},[el("summary",{textContent:t.policy}),el("p",{},lines(S.policy))])]:[])]);
  panel.append(xBtn(),el("div",{className:"sdet"},[el("div",{className:"sgal"},[big,thumbs]),buyBox]),more);show(0)}

/* ── 패키지(플랜): 구성 · 만드는 사람들(포트폴리오) · 진행 순서 ──
   상품의 pack 칸(JSON)에 파트와 담당을 적어 두면, 담당의 채널에 올라온 작품을 가져와 보여 줘요.
   pack = {limit:한정 수량, tag:{ko,ja,en}, priceLabel:{ko,ja,en}, cover:["채널" 또는 "채널:몇 번째"], parts:[{key:"mix|art|video|direct", opt:"옵션 이름", who:[{name,en,page,sec,n,val,note}]}]} */
const isPack=p=>!!(p&&p.pack&&Array.isArray(p.pack.parts));
const tx=o=>o==null?"":typeof o==="string"?o:(o[L]||o.ko||"");
const whoN=w=>(L!=="ko"&&w.en)||w.name;
const ytImg=id=>"https://i.ytimg.com/vi/"+id+"/hqdefault.jpg";
const pct=p=>Math.round((1-p.sale_price/p.price)*100)+"%",isOff=p=>saleOn(p);
/* 담당의 작품 고르기: 최신 순. sec 를 여러 개 적으면 탭마다 번갈아 한 점씩, skip 에 적은 글자가 주소에 들어간 작품은 빼요 */
const samples=w=>{if(!w.page||w.n===0)return [];let a=(IT[w.page]||[]).filter(i=>!(w.skip||[]).some(k=>String(i.url).includes(k)));
  if(w.sec){const g=[].concat(w.sec).map(k=>a.filter(i=>i.section===k));a=[];for(let i=0;g.some(x=>x[i]);i++)g.forEach(x=>{if(x[i])a.push(x[i])})}
  return a.slice(0,w.n||4)};
/* 남은 자리: 한정 수량(pack.limit) 중 재고(stock)만큼 남았어요 */
const meter=p=>{const tot=p.pack.limit,left=p.stock;if(!tot||left==null)return null;const n=Math.max(0,Math.min(tot,left));
  return el("div",{className:"sleft"},[el("div",{className:"sdots",ariaHidden:"true"},Array.from({length:tot},(_,i)=>el("i",{className:i<tot-n?"x":""}))),el("span",{textContent:t.first(tot)+" · "+t.left(n)})])};
/* 카드 그림: cover 에 적은 것 3장 — 사진 주소, "yt:영상ID", "채널" 또는 "채널:몇 번째" */
const packVis=p=>{const out=[];(p.pack.cover||[]).forEach(c=>{c=String(c);if(c.startsWith("yt:")){out.push(ytImg(c.slice(3)));return}if(c.includes("/")){out.push(c);return}
    const [pg,ix]=c.split(":"),a=IT[pg]||[],im=a.filter(x=>x.kind==="image"),yt=a.filter(x=>x.kind==="youtube"),i=+ix||0;if(im[i])out.push(im[i].url);else if(yt[i])out.push(ytImg(yt[i].url))});
  return (out.length?out:(p.images||[])).slice(0,3)};
function packCard(p){const pk=p.pack,so=p.status==="soldout",vis=packVis(p),m=meter(p);
  return el("a",{className:"scard pkc"+(so?" so":""),href:"?p="+p.id},[
    el("div",{className:"pkv n"+vis.length},[...vis.map(u=>el("img",{src:u,alt:"",loading:"lazy",decoding:"async"})),...(vis.length?[]:[el("span",{className:"sno",textContent:"RIF"})]),...(so?[el("span",{className:"sbadge",textContent:t.soldout})]:[]),...(p.status==="draft"?[el("span",{className:"pkd",textContent:t.draft})]:[])]),
    el("div",{className:"pkb"},[...(tx(pk.tag)?[el("p",{className:"tag",textContent:tx(pk.tag)})]:[]),el("h3",{textContent:nm(p)}),...(sm(p)?[el("p",{className:"ssum",textContent:sm(p)})]:[]),
      el("p",{className:"pkr",textContent:pk.parts.map(pt=>t.roles[pt.key]||pt.key).join(" / ")}),
      el("div",{className:"pkp"},[el("b",{textContent:won(unit(p))}),...(isOff(p)?[el("s",{textContent:won(p.price)}),el("em",{textContent:pct(p)})]:[])]),...(saleNote(p)?[saleNote(p)]:[]),
      ...(m?[m]:[]),el("span",{className:"btn",textContent:t.view})])])}
function sampleEls(ss){const im=ss.filter(i=>i.kind==="image"),yt=ss.filter(i=>i.kind==="youtube"),au=ss.filter(i=>i.kind==="audio"),out=[];
  if(im.length)out.push(el("div",{className:"pks imgs"},im.map(i=>{const g=el("img",{alt:i.caption||"",loading:"lazy",decoding:"async"}),b=el("button",{type:"button",className:"pkim"},[g]);
    const fit=()=>{if(g.naturalWidth)b.style.setProperty("--r",(g.naturalWidth/g.naturalHeight).toFixed(3))};g.addEventListener("load",fit);g.src=i.url;if(g.complete)fit();b.onclick=()=>zoom(i.url);return b})));
  if(yt.length)out.push(el("div",{className:"pks yts"},yt.map(i=>{const b=el("button",{type:"button",className:"pkyt",ariaLabel:t.play+(i.caption?" · "+i.caption:"")},[el("img",{src:ytImg(i.url),alt:"",loading:"lazy",decoding:"async"}),el("span",{className:"pkpl"})]);
    b.onclick=()=>b.replaceWith(el("iframe",{src:"https://www.youtube-nocookie.com/embed/"+encodeURIComponent(i.url)+"?autoplay=1&rel=0",allow:"autoplay; encrypted-media; picture-in-picture",allowFullscreen:true,title:i.caption||"YouTube"}));
    return el("figure",{},[b,...(i.caption?[el("figcaption",{textContent:i.caption})]:[])])})));
  if(au.length)out.push(el("div",{className:"pks aus"},au.map(i=>el("div",{},[el("b",{textContent:i.caption||""}),el("audio",{controls:true,preload:"none",src:i.url})]))));
  return out}
function drawPack(p){const pk=p.pack,U=buyUI(p),off=isOff(p),picks=[];panel.classList.add("pack");
  const sec=(h,...k)=>el("section",{className:"pksec"},[el("h3",{textContent:h}),...k]);
  const head=el("div",{className:"pkh"},[el("p",{className:"tag",textContent:[t.plan,tx(pk.tag)].filter(Boolean).join(" / ")}),el("h2",{textContent:nm(p)}),...(sm(p)?[el("p",{className:"pklead",textContent:sm(p)})]:[])]);
  /* 구성: 파트마다 누가 맡는지 */
  const inc=el("ul",{className:"pkinc"},pk.parts.map(pt=>el("li",{},[el("b",{textContent:t.roles[pt.key]||pt.key}),el("span",{},(pt.who||[]).flatMap((w,i)=>[...(i?[el("i",{textContent:" / "})]:[]),whoN(w),...(tx(w.note)?[el("small",{textContent:" ("+tx(w.note)+")"})]:[])]))])));
  /* 만드는 사람들: 담당마다 작품 몇 점 + 고를 수 있으면 '선택' */
  const team=pk.parts.map(pt=>{const sel=pt.opt&&U.canOrder?U.sels.find(s=>s.dataset.n===pt.opt):null;
    const blocks=(pt.who||[]).map(w=>{const ss=samples(w);if(!ss.length&&!sel)return null;const val=w.val||w.name;let btn=null;
      if(sel&&pt.who.length>1){btn=el("button",{type:"button",className:"pkpick"});btn.onclick=()=>{sel.value=sel.value===val?"":val;sel.dispatchEvent(new Event("change"))}}
      const a=el("article",{className:"pkw"},[el("div",{className:"pkwh"},[el("h5",{textContent:whoN(w)}),...(tx(w.note)?[el("span",{className:"pkn",textContent:tx(w.note)})]:[]),...(w.page?[el("a",{className:"pkfo",href:"../"+w.page+"/",target:"_blank",rel:"noopener",textContent:t.folio})]:[]),...(btn?[btn]:[])]),...sampleEls(ss)]);
      if(btn)picks.push([sel,val,btn,a]);return a}).filter(Boolean);
    return blocks.length?el("div",{className:"pkpart"},[el("h4",{textContent:t.roles[pt.key]||pt.key}),...blocks]):null}).filter(Boolean);
  const sync=()=>picks.forEach(([sel,val,btn,a])=>{const on=sel.value===val;btn.textContent=on?t.picked:t.pick;btn.setAttribute("aria-pressed",String(on));a.classList.toggle("on",on)});
  U.sels.forEach(s=>s.addEventListener("change",sync));sync();
  const flow=el("ol",{className:"pkflow"},t.steps.map(([a,b])=>el("li",{},[el("b",{textContent:a}),el("span",{textContent:b})])));
  /* 구매 칸 */
  const sN=saleNote(p),price=el("div",{className:"pkpr"},[...(off&&tx(pk.priceLabel)&&!(p.sale_label&&tx(p.sale_label))?[el("p",{textContent:tx(pk.priceLabel)})]:[]),el("b",{textContent:won(unit(p))}),...(off?[el("p",{className:"pkwas"},[t.listp+" ",el("s",{textContent:won(p.price)})," ",el("em",{textContent:pct(p)})])]:[]),...(sN?[sN]:[])]);
  const m=meter(p),hasAdd=(p.options||[]).some(o=>o.add&&Object.values(o.add).some(Number));
  const buy=el("div",{className:"pkbuy"},[price,...(m?[m]:[]),...(U.canOrder?[...U.sels.map(s=>el("label",{className:"pksel"},[el("span",{textContent:s.getAttribute("aria-label")}),s])),...(U.lim>1?[U.qty]:[]),...(U.lim>1||hasAdd?[U.tot]:[])]:[]),U.acts,
    ...(U.canOrder?[el("p",{className:"pklater",textContent:t.payLater})]:[]),...(!U.so&&!U.live&&p.buy_mode==="order"?[el("p",{className:"note",textContent:t.closed})]:[]),el("a",{className:"pkask",href:"../contact/",textContent:t.askPre})]);
  const main=el("div",{className:"pkmain"},[sec(t.inc,inc),...(team.length?[sec(t.team,...(picks.length?[el("p",{className:"pknote",textContent:t.teamNote})]:[]),...team)]:[]),sec(t.flow,flow),
    ...(dt(p)?[sec(t.detail,el("p",{className:"pktxt"},lines(dt(p))))]:[]),...(S.policy?[el("details",{className:"pkpol"},[el("summary",{textContent:t.policy}),el("p",{},lines(S.policy))])]:[])]);
  /* 휴대폰: 아래에 붙어 있는 주문 띠 */
  const go=el("button",{type:"button",className:"btn",textContent:U.so?t.soldout:t.order,disabled:!U.buy||!U.live});go.onclick=()=>U.buy&&U.buy();
  const bar=el("div",{className:"pkbar"},[el("div",{},[el("b",{textContent:won(unit(p))}),...(off?[el("s",{textContent:won(p.price)})]:[])]),go]);
  panel.append(xBtn(),el("div",{className:"pkg"},[head,el("aside",{className:"pkside"},[buy]),main]),...(U.canOrder?[bar]:[]))}

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
    el("div",{className:"scp"},[el("input",{id:"scode",maxLength:24,placeholder:sx().cp,autocomplete:"off",ariaLabel:sx().cp}),el("button",{type:"button",className:"btn ghost",id:"scgo",textContent:sx().cpGo})]),
    el("p",{className:"note",id:"scmsg",hidden:true}),
    el("div",{className:"srow off",id:"scrow",hidden:true},[el("span",{textContent:sx().cpOff}),el("b",{id:"scamt"})]),
    ...(ME&&ME.points>0?[el("div",{className:"scp"},[el("input",{id:"spts",type:"number",min:0,step:10,max:ME.points,inputMode:"numeric",placeholder:ax().ptUse(won(ME.points)),ariaLabel:ax().pt}),el("button",{type:"button",className:"btn ghost",id:"sptall",textContent:ax().ptAll})]),
      el("div",{className:"srow off",id:"sprow",hidden:true},[el("span",{textContent:ax().pt}),el("b",{id:"spamt"})])]:[]),
    ...(ME&&Number(ME.point_rate)>0?[el("p",{className:"note",id:"searn"})]:[]),
    ...(!ME?[(()=>{const b=el("button",{type:"button",className:"slook",textContent:ax().ckHint});b.onclick=()=>open("acct");return b})()]:[]),
    el("div",{className:"srow big"},[el("span",{textContent:t.pay}),el("b",{id:"stotal",textContent:won(m.total)})]),
    el("p",{className:"note err",id:"serr",hidden:true}),
    el("div",{className:"wr"},[el("button",{type:"button",className:"btn ghost",id:"sback",textContent:t.back}),el("button",{className:"btn",id:"sgo",textContent:t.place})])]);
  panel.append(xBtn(),el("h2",{textContent:t.ckTitle}),form);
  form.querySelector("#sback").onclick=()=>open("cart");
  /* 쿠폰: 서버가 지금 가격으로 할인액을 계산해 줘요. 주문할 때 서버에서 한 번 더 확인해요 */
  let coupon="";const q=i=>form.querySelector("#"+i),cpErr=m2=>{const k=Object.keys(sx().ce).find(k=>String(m2).includes(k));return k?sx().ce[k]:String(m2)};
  let cdisc=0;const ptI=q("spts"),ptsNow=()=>ptI?Math.max(0,Math.min(Math.floor(Number(ptI.value)||0),ME?ME.points:0,m.sub-cdisc)):0;
  const recalc=()=>{const p2=ptsNow();if(q("sprow")){q("sprow").hidden=!p2;q("spamt").textContent=p2?"− "+won(p2):""}q("stotal").textContent=won(m.total-cdisc-p2);
    if(q("searn")){const e2=Math.floor(Math.max(0,m.sub-cdisc-p2)*Number(ME.point_rate)/100/10)*10;q("searn").textContent=e2>0?ax().earn(won(e2)):"";q("searn").hidden=!e2}};
  const cpShow=d=>{cdisc=d||0;q("scrow").hidden=!d;q("scamt").textContent=d?"− "+won(d):"";recalc()};
  if(ptI){ptI.oninput=recalc;q("sptall").onclick=()=>{ptI.value=Math.min(ME.points,m.sub-cdisc);recalc()}}
  if(ME){[["sname",ME.name],["semail",ME.email],["sphone",ME.phone],["szip",ME.zip],["saddr",[ME.addr,ME.addr2].filter(Boolean).join(" ")]].forEach(([i,v])=>{if(q(i)&&v)q(i).value=v})}recalc();
  q("scgo").onclick=async()=>{const msg=q("scmsg");if(coupon){coupon="";q("scode").value="";q("scode").disabled=false;q("scgo").textContent=sx().cpGo;msg.hidden=true;cpShow(0);return}
    const code=q("scode").value.trim().toUpperCase();if(!code)return;q("scgo").disabled=true;
    const {data,error}=await db.rpc("store_coupon_check",{p_code:code,p_items:its.map(x=>({id:x.p.id,qty:x.c.qty,opts:x.c.opts}))});q("scgo").disabled=false;
    if(error){msg.className="note err";msg.textContent=cpErr(error.message);msg.hidden=false;cpShow(0);return}
    coupon=data.code;q("scode").value=data.code;q("scode").disabled=true;q("scgo").textContent=sx().cpX;msg.hidden=true;cpShow(data.discount)};
  q("scode").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();q("scgo").click()}});
  form.onsubmit=async e=>{e.preventDefault();const g=i=>{const x=form.querySelector("#"+i);return x?x.value.trim():""},er=form.querySelector("#serr"),b=form.querySelector("#sgo");
    const pu=ptsNow();if(pu>0&&pu<(ME.point_min||0)){er.textContent=ax().ptMin(won(ME.point_min));er.hidden=false;return}
    b.disabled=true;er.hidden=true;
    const cc=await myCC().catch(()=>"");const {data,error}=await db.rpc("store_order",{p:{cc,lang:L,name:g("sname"),email:g("semail"),phone:g("sphone"),zip:g("szip"),addr:g("saddr"),memo:g("smemo"),items:its.map(x=>({id:x.p.id,qty:x.c.qty,opts:x.c.opts})),...(coupon?{coupon}:{}),...(pu>0?{points:pu}:{})}});
    b.disabled=false;
    if(error){const m2=String(error.message||""),k=Object.keys(t.e).find(k=>m2.includes(k));er.textContent=t.err+(/coupon/.test(m2)?cpErr(m2):/points|login required/.test(m2)?ax().ptErr:k?t.e[k]+(m2.includes(":")&&/stock|sale|option/.test(k)?" ("+m2.split(":").slice(1).join(":").trim()+")":""):m2);er.hidden=false;if(/stock|sale/.test(m2))load();return}
    setCart([]);lookName=g("sname");if(ME)refreshMe();/* 주문 확인 메일 (주문번호 안내) */db.functions.invoke("store-order-mail",{body:{no:data.no,email:g("semail"),lang:L}}).catch(()=>{});open("done",data,g("semail"))}}

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
  panel.append(xBtn(),el("p",{className:"tag",textContent:"THANK YOU"}),el("h2",{textContent:t.doneT}),el("div",{className:"sno2"},[el("span",{textContent:t.doneNo}),el("b",{textContent:d.no})]),...(d.discount?[el("div",{className:"srow off"},[el("span",{textContent:sx().cpOff}),el("b",{textContent:"− "+won(d.discount)})])]:[]),...(d.points_used?[el("div",{className:"srow off"},[el("span",{textContent:ax().pt}),el("b",{textContent:"− "+won(d.points_used)})])]:[]),
    el("div",{className:"srow big"},[el("span",{textContent:t.pay}),el("b",{textContent:won(d.total)})]),/* 후불: 주문 완료 때는 결제 안내만, 결제는 발송 후 주문 조회에서 */laterBox(),
    el("p",{className:"note",textContent:t.doneMail}),(()=>{const b=el("button",{type:"button",className:"btn",textContent:t.keep});b.onclick=close;return b})())}
let lookName="";
function orderCard(data,mail,name,refresh){const d=new Date(data.created_at);
  return el("div",{className:"slcard"},[el("div",{className:"slhd"},[el("b",{textContent:t.doneNo+" "+data.no}),el("span",{className:"note",textContent:isNaN(d)?"":d.toLocaleDateString(L==="ko"?"ko-KR":L==="ja"?"ja-JP":"en-US")})]),
    el("div",{className:"sstat "+data.status,textContent:t.st[data.status]||data.status}),
    el("ul",{className:"slines sm"},(data.items||[]).map(i=>el("li",{},[el("div",{},[el("b",{textContent:i.name}),...(Object.keys(i.opts||{}).length?[el("small",{textContent:Object.entries(i.opts).map(([k,v])=>k+": "+v).join(" · ")})]:[]),el("small",{textContent:"× "+i.qty})]),el("b",{className:"slp",textContent:won(i.unit*i.qty)})]))),...(data.discount?[el("div",{className:"srow off"},[el("span",{textContent:sx().cpOff}),el("b",{textContent:"− "+won(data.discount)})])]:[]),...(data.points_used?[el("div",{className:"srow off"},[el("span",{textContent:ax().pt}),el("b",{textContent:"− "+won(data.points_used)})])]:[]),...(data.points_earned?[el("div",{className:"srow"},[el("span",{textContent:ax().earned}),el("span",{textContent:"+ "+won(data.points_earned)})])]:[]),
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

/* ===== 회원 (팬 계정) =====
   가입·로그인은 Supabase Auth. 직원 주소(@rif-studio.com)는 여기서 가입할 수 없어요 (서버에서 막아요).
   내 정보 · 주문 · 적립금은 서버 함수(fan_me · fan_save · fan_orders · fan_points_log · fan_withdraw)로만 읽고 써요. */
const AX={ko:{login:"로그인",my:"내 계정",join:"회원가입",email:"이메일",pw:"비밀번호",pw8:"비밀번호 (8자 이상)",nick:"닉네임",go:"로그인",goJoin:"가입하기",toJoin:"처음이신가요? 회원가입",toLogin:"이미 회원이에요 · 로그인",forgot:"비밀번호를 잊었어요",
  agree:"이용 안내와 개인정보 수집 · 이용에 동의해요. (필수)",age:"만 14세 이상이에요. (필수)",mkt:"세일 · 신상품 소식을 이메일로 받을게요. (선택)",privT:"개인정보 수집 · 이용 안내 보기",
  priv:"· 수집 항목: (필수) 이메일, 비밀번호, 닉네임, 이름, 휴대폰 번호, 디스코드 아이디 / (선택) 배송지 주소\n· 이용 목적: 회원 확인, 주문 연락 · 처리와 굿즈 배송, 디스코드 1:1 문의 응대, 적립금 관리, 문의 응대\n· 보관 기간: 탈퇴하면 바로 지워요. 다만 주문 기록은 전자상거래법에 따라 5년 동안 보관해요.\n· 동의하지 않을 수 있지만, 그러면 회원가입은 할 수 없어요. 비회원으로도 주문할 수 있어요.\n· 문의: rif@rif-studio.com",
  sent:m=>m+" 로 인증 메일을 보냈어요. 메일의 링크를 누르면 가입이 끝나요. (메일이 안 보이면 스팸함도 확인해 주세요)",exists:"이미 가입된 이메일이에요. 로그인하거나 비밀번호 찾기를 써 주세요.",badLogin:"이메일이나 비밀번호가 맞지 않아요.",notConf:"아직 이메일 인증이 안 됐어요. 받은 메일의 링크를 눌러 주세요.",weak:"비밀번호는 8자 이상으로 해 주세요.",fail:"잠시 뒤에 다시 시도해 주세요.",noJoin:"이 이메일로는 가입할 수 없어요.",
  resetT:"비밀번호 찾기",resetGo:"재설정 메일 보내기",resetSent:"비밀번호를 다시 정하는 메일을 보냈어요.",newpwT:"새 비밀번호 정하기",newpwGo:"비밀번호 바꾸기",newpwOk:"비밀번호를 바꿨어요.",
  or:"또는",withG:"Google로 계속하기",withX:"X(트위터)로 계속하기",hi:n=>n+" 님",pt:"적립금",ptHave:"보유 적립금",tabO:"주문 내역",tabP:"적립금",tabI:"내 정보",noOrders:"아직 주문이 없어요.",noPts:"아직 적립금 내역이 없어요.",
  rs:{signup:"가입 축하",use:"주문에 사용",earn:"구매 적립",refund:"주문 취소 · 돌려받음","earn cancel":"주문 취소 · 적립 회수"},name:"이름 (실명)",phone:"휴대폰 번호",zip:"우편번호",addr:"주소",addr2:"상세 주소",discord:"디스코드 아이디 (1:1 문의용)",addrOpt:"배송지 (선택 · 굿즈 주문 때 자동으로 채워져요)",findAddr:"주소 찾기",need:"이름, 휴대폰 번호, 디스코드 아이디를 입력해 주세요.",badDc:"디스코드 아이디를 확인해 주세요. (영문 · 숫자 · _ . 2~32자)",badPhone:"휴대폰 번호를 확인해 주세요.",fillT:"회원 정보 입력",fillNote:"주문 연락과 굿즈 배송을 위해 몇 가지만 더 알려 주세요.",save:"저장",saved:"저장했어요 ✓",logout:"로그아웃",leave:"회원 탈퇴",
  leaveQ:"정말 탈퇴할까요?\n계정과 적립금이 바로 지워지고 되돌릴 수 없어요. (주문 기록은 법에 따라 보관돼요)",left:"탈퇴했어요. 그동안 고마웠어요.",chpw:"비밀번호 바꾸기",
  ptUse:b=>"적립금 쓰기 (보유 "+b+")",ptAll:"모두 쓰기",ptMin:m=>"적립금은 "+m+"부터 쓸 수 있어요.",ptErr:"적립금을 쓸 수 없어요. 보유 적립금을 확인해 주세요.",earn:e=>"결제가 확인되면 약 "+e+" 적립돼요.",earned:"적립",
  ckHint:"로그인하면 적립금을 쓰고 쌓을 수 있어요 · 로그인 / 회원가입",monly:"회원가",mprice:pv=>"회원가 "+pv+" · 로그인하면 받아요",welcome:"가입이 끝났어요. 환영해요!"},
 ja:{login:"ログイン",my:"マイページ",join:"会員登録",email:"メールアドレス",pw:"パスワード",pw8:"パスワード（8文字以上）",nick:"ニックネーム",go:"ログイン",goJoin:"登録する",toJoin:"はじめての方 · 会員登録",toLogin:"会員の方 · ログイン",forgot:"パスワードをお忘れの方",
  agree:"ご利用案内と個人情報の収集・利用に同意します。（必須）",age:"14歳以上です。（必須）",mkt:"セール・新商品のお知らせをメールで受け取ります。（任意）",privT:"個人情報の収集・利用について",
  priv:"· 収集項目:（必須）メールアドレス、パスワード、ニックネーム、お名前、電話番号、Discord ID /（任意）お届け先住所\n· 利用目的: 会員確認、ご注文の処理と発送、ポイント管理、お問い合わせ対応\n· 保管期間: 退会後すぐに削除します。ただし注文記録は韓国の電子商取引法により5年間保管します。\n· 同意されない場合、会員登録はできませんが、非会員でもご注文いただけます。\n· お問い合わせ: rif@rif-studio.com",
  sent:m=>m+" に確認メールを送りました。メール内のリンクを押すと登録完了です。（届かない場合は迷惑メールもご確認ください）",exists:"すでに登録済みのメールアドレスです。ログインするか、パスワード再設定をご利用ください。",badLogin:"メールアドレスまたはパスワードが違います。",notConf:"メール認証がまだ完了していません。届いたメールのリンクを押してください。",weak:"パスワードは8文字以上にしてください。",fail:"しばらくしてからもう一度お試しください。",noJoin:"このメールアドレスでは登録できません。",
  resetT:"パスワード再設定",resetGo:"再設定メールを送る",resetSent:"パスワード再設定のメールを送りました。",newpwT:"新しいパスワード",newpwGo:"パスワードを変更",newpwOk:"パスワードを変更しました。",
  or:"または",withG:"Googleで続ける",withX:"X（Twitter）で続ける",hi:n=>n+" さん",pt:"ポイント",ptHave:"保有ポイント",tabO:"注文履歴",tabP:"ポイント",tabI:"会員情報",noOrders:"ご注文はまだありません。",noPts:"ポイント履歴はまだありません。",
  rs:{signup:"登録特典",use:"ご注文で利用",earn:"お買い物ポイント",refund:"注文キャンセル · 返還","earn cancel":"注文キャンセル · 取消"},name:"お名前（本名）",phone:"電話番号",zip:"郵便番号",addr:"ご住所",addr2:"建物名・部屋番号",discord:"Discord ID（1:1お問い合わせ用）",addrOpt:"お届け先（任意 · グッズご注文時に自動入力）",findAddr:"住所検索",need:"お名前・電話番号・Discord IDを入力してください。",badDc:"Discord IDをご確認ください。（英数字・_ . 2〜32文字）",badPhone:"電話番号をご確認ください。",fillT:"会員情報の入力",fillNote:"ご注文のご連絡とグッズ発送のため、いくつか教えてください。",save:"保存",saved:"保存しました ✓",logout:"ログアウト",leave:"退会する",
  leaveQ:"本当に退会しますか？\nアカウントとポイントはすぐに削除され、元に戻せません。（注文記録は法令に基づき保管されます）",left:"退会しました。ありがとうございました。",chpw:"パスワード変更",
  ptUse:b=>"ポイントを使う（保有 "+b+"）",ptAll:"すべて使う",ptMin:m=>"ポイントは "+m+" からご利用いただけます。",ptErr:"ポイントを利用できません。保有ポイントをご確認ください。",earn:e=>"お支払い確認後、約 "+e+" 分のポイントが貯まります。",earned:"獲得ポイント",
  ckHint:"ログインするとポイントが使えて貯まります · ログイン / 会員登録",monly:"会員価格",mprice:pv=>"会員価格 "+pv+" · ログインで適用",welcome:"登録が完了しました。ようこそ！"},
 en:{login:"Log in",my:"My account",join:"Sign up",email:"Email",pw:"Password",pw8:"Password (8+ characters)",nick:"Nickname",go:"Log in",goJoin:"Create account",toJoin:"New here? Sign up",toLogin:"Already a member? Log in",forgot:"Forgot your password?",
  agree:"I agree to the terms and to the collection and use of my personal information. (Required)",age:"I am 14 or older. (Required)",mkt:"Email me about sales and new items. (Optional)",privT:"How we use your information",
  priv:"· What we collect: (required) email, password, nickname, full name, phone, Discord ID / (optional) shipping address\n· Why: to identify members, process and ship orders, manage points and answer questions\n· How long: deleted as soon as you close your account. Order records are kept for 5 years under Korean e-commerce law.\n· You may decline, but then you can't create an account. You can still order as a guest.\n· Contact: rif@rif-studio.com",
  sent:m=>"We sent a confirmation email to "+m+". Open the link in it to finish signing up. (Check your spam folder if you don't see it.)",exists:"This email is already registered. Log in or reset your password.",badLogin:"The email or password is incorrect.",notConf:"Your email isn't confirmed yet. Please open the link we sent you.",weak:"Please use at least 8 characters.",fail:"Please try again in a moment.",noJoin:"You can't sign up with this email.",
  resetT:"Reset password",resetGo:"Send reset email",resetSent:"We sent you an email to reset your password.",newpwT:"Set a new password",newpwGo:"Change password",newpwOk:"Your password has been changed.",
  or:"or",withG:"Continue with Google",withX:"Continue with X (Twitter)",hi:n=>"Hi, "+n,pt:"Points",ptHave:"Your points",tabO:"Orders",tabP:"Points",tabI:"My info",noOrders:"No orders yet.",noPts:"No points history yet.",
  rs:{signup:"Welcome bonus",use:"Used on an order",earn:"Earned from a purchase",refund:"Order cancelled · returned","earn cancel":"Order cancelled · reversed"},name:"Full name",phone:"Phone",zip:"Postal code",addr:"Address",addr2:"Apt, suite, etc.",discord:"Discord ID (for 1:1 support)",addrOpt:"Shipping address (optional · filled in for goods orders)",findAddr:"Find address",need:"Please enter your name, phone number and Discord ID.",badDc:"Please check your Discord ID (letters, numbers, _ and ., 2–32 characters).",badPhone:"Please check your phone number.",fillT:"Complete your profile",fillNote:"Please add a few details so we can contact you and ship goods.",save:"Save",saved:"Saved ✓",logout:"Log out",leave:"Delete account",
  leaveQ:"Delete your account?\nYour account and points are removed right away and can't be restored. (Order records are kept as required by law.)",left:"Your account has been deleted. Thank you.",chpw:"Change password",
  ptUse:b=>"Use points (you have "+b+")",ptAll:"Use all",ptMin:m=>"Points can be used from "+m+".",ptErr:"Points couldn't be applied. Please check your balance.",earn:e=>"You'll earn about "+e+" in points once payment is confirmed.",earned:"Points earned",
  ckHint:"Log in to use and earn points · Log in / Sign up",monly:"Member price",mprice:pv=>"Member price "+pv+" · log in to get it",welcome:"You're all set. Welcome!"}};
const ax=()=>AX[L]||AX.ko;
let EXT=null;const extProviders=async()=>{if(EXT)return EXT;try{EXT=(await fetch(RIF.URL+"/auth/v1/settings",{headers:{apikey:RIF.KEY}}).then(r=>r.json())).external||{}}catch(_){EXT={}}return EXT};
async function refreshMe(){try{const s=(await db.auth.getSession()).data.session;if(!s)ME=null;else{const {data}=await db.rpc("fan_me");ME=data||null}}catch(_){ME=null}labels();return ME}
const STORE_URL=location.origin+"/store/";
const PHONE_RE=/^\+?[0-9][0-9\-\s()]{7,19}$/,DC_RE=/^@?[A-Za-z0-9_.]{2,32}(#[0-9]{4})?$/;
/* 필수 항목 검사: 이름 · 휴대폰 · 디스코드. 문제가 있으면 안내 문구를, 없으면 "" */
const pfErr=pf=>!pf.name||!pf.phone||!pf.discord?ax().need:!PHONE_RE.test(pf.phone)?ax().badPhone:!DC_RE.test(pf.discord)?ax().badDc:"";
/* 한국 주소 찾기 (카카오 우편번호 서비스, 무료). 해외 주소는 직접 입력 */
let DAUM=null;const daum=()=>DAUM||(DAUM=new Promise((ok,no)=>{const sc=document.createElement("script");sc.src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";sc.onload=ok;sc.onerror=no;document.head.append(sc)}));
function addrBlock(v,prefix){v=v||{};const id=k=>prefix+k;
  const zip=el("input",{id:id("zp"),value:v.zip||"",autocomplete:"postal-code",maxLength:10,placeholder:ax().zip}),a1=el("input",{id:id("ad"),value:v.addr||"",autocomplete:"address-line1",maxLength:200,placeholder:ax().addr}),a2=el("input",{id:id("a2"),value:v.addr2||"",autocomplete:"address-line2",maxLength:100,placeholder:ax().addr2});
  const fb=el("button",{type:"button",className:"btn ghost",textContent:ax().findAddr});
  fb.onclick=async()=>{try{await daum();new daum.Postcode({oncomplete:d=>{zip.value=d.zonecode;a1.value=d.roadAddress||d.jibunAddress;a2.focus()}}).open()}catch(_){a1.focus()}};
  return el("div",{className:"saddrb"},[el("span",{className:"note",textContent:ax().addrOpt}),el("div",{className:"scp"},[zip,fb]),a1,a2])}
const profileFields=(v,prefix,withNick)=>{v=v||{};const f=(k,lab,val,ac,req,type)=>el("label",{},[el("span",{textContent:lab+(req?" *":"")}),el("input",{id:prefix+k,value:val||"",autocomplete:ac||"off",maxLength:k==="ph"?20:k==="dc"?40:60,required:!!req,type:type||"text"})]);
  return [...(withNick?[f("nk",ax().nick,v.nick,"nickname",1)]:[]),f("nm",ax().name,v.name,"name",1),f("ph",ax().phone,v.phone,"tel",1,"tel"),f("dc",ax().discord,v.discord,"off",1),addrBlock(v,prefix)]};
const readProfile=(root,prefix)=>{const g=k=>{const x=root.querySelector("#"+prefix+k);return x?x.value.trim():""};return {nick:g("nk"),name:g("nm"),phone:g("ph"),discord:g("dc"),zip:g("zp"),addr:g("ad"),addr2:g("a2")}};
function drawAcct(mode,note){
  panel.classList.add("sacct");
  const msg=el("p",{className:"note",hidden:!note,textContent:note||""}),say=(m,bad)=>{msg.textContent=m;msg.className="note"+(bad?" err":"");msg.hidden=false};
  const inp=(id,lab,type,ac,min)=>el("label",{},[el("span",{textContent:lab}),el("input",{id,type:type||"text",required:true,autocomplete:ac||"off",maxLength:type==="email"?120:72,...(min?{minLength:min}:{})})]);
  const link=(tx2,fn)=>{const b=el("button",{type:"button",textContent:tx2});b.onclick=fn;return b};
  const authErr=e=>{const m=String((e&&e.message)||e);return /Invalid login/i.test(m)?ax().badLogin:/not confirmed/i.test(m)?ax().notConf:/at least|weak|short/i.test(m)?ax().weak:/Database error|signup disabled|not allowed/i.test(m)?ax().noJoin:ax().fail};
  /* 새 비밀번호 (메일의 재설정 링크로 들어왔을 때) */
  if(mode==="newpw"){const f=el("form",{className:"sform"},[inp("apw",ax().pw8,"password","new-password",8),el("button",{className:"btn",textContent:ax().newpwGo}),msg]);
    f.onsubmit=async e=>{e.preventDefault();const {error}=await db.auth.updateUser({password:f.querySelector("#apw").value});if(error)return say(authErr(error),1);await refreshMe();open("acct","",ax().newpwOk)};
    panel.append(xBtn(),el("h2",{textContent:ax().newpwT}),f);return}
  if(!ME){
    if(mode==="reset"){const f=el("form",{className:"sform"},[inp("aem",ax().email,"email","email"),el("button",{className:"btn",textContent:ax().resetGo}),msg,el("div",{className:"slinks"},[link(ax().toLogin,()=>open("acct"))])]);
      f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector(".btn");b.disabled=true;const {error}=await db.auth.resetPasswordForEmail(f.querySelector("#aem").value.trim(),{redirectTo:STORE_URL});b.disabled=false;error?say(authErr(error),1):say(ax().resetSent)};
      panel.append(xBtn(),el("h2",{textContent:ax().resetT}),f);return}
    const join=mode==="join",oauth=el("div",{className:"soauth",hidden:true});
    extProviders().then(x=>{const bs=[["google",ax().withG],["twitter",ax().withX]].filter(([k])=>x[k]).map(([k,lab])=>{const b=el("button",{type:"button",className:"btn ghost wide",textContent:lab});b.onclick=()=>db.auth.signInWithOAuth({provider:k,options:{redirectTo:STORE_URL}});return b});
      if(bs.length){oauth.append(el("p",{className:"sor",textContent:ax().or}),...bs);oauth.hidden=false}});
    const ck=(id,lab,req)=>el("label",{className:"sagree2"},[el("input",{type:"checkbox",id,required:!!req}),el("span",{textContent:lab})]);
    const f=el("form",{className:"sform"},[inp("aem",ax().email,"email","email"),inp("apw",join?ax().pw8:ax().pw,"password",join?"new-password":"current-password",join?8:0),
      ...(join?[...profileFields({},"j",1),ck("aag",ax().agree,1),ck("aage",ax().age,1),ck("amk",ax().mkt,0),el("details",{},[el("summary",{className:"note",textContent:ax().privT}),el("p",{className:"spriv",textContent:ax().priv}),el("a",{href:"/privacy/",target:"_blank",rel:"noopener",className:"note",textContent:"→ "+(L==="ja"?"個人情報の取り扱い（全文）":L==="en"?"Full privacy policy":"개인정보처리방침 전문")})])]:[]),
      el("button",{className:"btn",textContent:join?ax().goJoin:ax().go}),msg,oauth,el("div",{className:"slinks"},join?[link(ax().toLogin,()=>open("acct"))]:[link(ax().toJoin,()=>open("acct","join")),link(ax().forgot,()=>open("acct","reset"))])]);
    f.onsubmit=async e=>{e.preventDefault();const g=i=>f.querySelector("#"+i),b=f.querySelector(".btn"),em=g("aem").value.trim(),pw=g("apw").value;b.disabled=true;msg.hidden=true;
      if(join){const pf=readProfile(f,"j"),pe=pfErr(pf);if(pe){b.disabled=false;return say(pe,1)}
        const {data,error}=await db.auth.signUp({email:em,password:pw,options:{data:{nick:pf.nick.slice(0,30),real_name:pf.name,phone:pf.phone,discord:pf.discord,zip:pf.zip,addr:pf.addr,addr2:pf.addr2,marketing:g("amk").checked},emailRedirectTo:STORE_URL}});b.disabled=false;
        if(error)return say(authErr(error),1);if(data.user&&data.user.identities&&!data.user.identities.length)return say(ax().exists,1);
        if(data.session){await refreshMe();draw();return open("acct","",ax().welcome)}f.replaceChildren(el("p",{className:"sguide",textContent:ax().sent(em)}));return}
      const {error}=await db.auth.signInWithPassword({email:em,password:pw});b.disabled=false;if(error)return say(authErr(error),1);await refreshMe();draw();open("acct")};
    panel.append(xBtn(),el("h2",{textContent:join?ax().join:ax().login}),f);return}
  /* 소셜로 가입했거나 정보가 빠진 회원: 이름 · 휴대폰부터 받아요 */
  if(mode==="fill"||((!ME.name||!ME.phone||!ME.discord)&&mode!=="i"&&mode!=="o"&&mode!=="p")){
    const f=el("form",{className:"sform"},[el("p",{className:"note",textContent:ax().fillNote}),...profileFields(ME,"f",1),el("button",{className:"btn",textContent:ax().save}),msg]);
    f.onsubmit=async e=>{e.preventDefault();const pf=readProfile(f,"f"),pe=pfErr(pf);if(pe)return say(pe,1);
      const {error}=await db.rpc("fan_save",{p:pf});if(error)return say(ax().fail,1);await refreshMe();open("acct","o")};
    panel.append(xBtn(),el("h2",{textContent:ax().fillT}),f);return}
  /* 마이페이지 */
  const body=el("div"),tabs=el("div",{className:"stabs"}),tab=mode==="p"||mode==="i"?mode:"o";
  [["o",ax().tabO],["p",ax().tabP],["i",ax().tabI]].forEach(([k,lab])=>{const b=el("button",{type:"button",textContent:lab});b.setAttribute("aria-pressed",String(k===tab));b.onclick=()=>open("acct",k);tabs.append(b)});
  panel.append(xBtn(),el("p",{className:"tag",textContent:"MEMBER"}),el("h2",{textContent:ax().hi(ME.nick||ME.email)}),el("div",{className:"sptbox"},[el("span",{textContent:ax().ptHave}),el("b",{textContent:won(ME.points)})]),msg,tabs,body);
  if(tab==="o"){db.rpc("fan_orders").then(({data})=>{const rows=data||[];if(!rows.length){body.append(el("p",{className:"empty",textContent:ax().noOrders}));return}
      rows.forEach(o=>{lookName=o.name;body.append(orderCard(o,o.email,o.name,()=>refreshMe().then(()=>open("acct","o"))))})})}
  else if(tab==="p"){db.rpc("fan_points_log").then(({data})=>{const rows=data||[];if(!rows.length){body.append(el("p",{className:"empty",textContent:ax().noPts}));return}
      body.append(el("ul",{className:"sptl"},rows.map(r=>el("li",{},[el("div",{},[el("span",{textContent:ax().rs[r.reason]||r.reason}),el("small",{textContent:new Date(r.created_at).toLocaleDateString(L==="ko"?"ko-KR":L==="ja"?"ja-JP":"en-US")+(r.order_no?" · "+r.order_no:"")})]),el("b",{className:r.delta<0?"m":"",textContent:(r.delta>0?"+ ":"− ")+won(Math.abs(r.delta))})]))))})}
  else{const fl=(id,lab,v,ac)=>el("label",{},[el("span",{textContent:lab}),el("input",{id,value:v||"",autocomplete:ac||"off",maxLength:200})]);
    const mk=el("input",{type:"checkbox",id:"imk",checked:!!ME.marketing});
    const f=el("form",{className:"sform"},[el("label",{},[el("span",{textContent:ax().email}),el("input",{value:ME.email,disabled:true})]),...profileFields(ME,"i",1),
      el("label",{className:"sagree2"},[mk,el("span",{textContent:ax().mkt})]),el("button",{className:"btn",textContent:ax().save})]);
    f.onsubmit=async e=>{e.preventDefault();const pf=readProfile(f,"i"),pe=pfErr(pf);if(pe)return say(pe,1);const {error}=await db.rpc("fan_save",{p:{...pf,marketing:mk.checked}});if(error)return say(ax().fail,1);await refreshMe();say(ax().saved)};
    const out=link(ax().logout,async()=>{await db.auth.signOut();ME=null;labels();draw();close()}),pw=link(ax().chpw,()=>open("acct","newpw"));
    const lv=link(ax().leave,async()=>{if(!confirm(ax().leaveQ))return;const {error}=await db.rpc("fan_withdraw");if(error)return say(ax().fail,1);await db.auth.signOut().catch(()=>{});ME=null;labels();draw();close();alert(ax().left)});
    body.append(f,el("div",{className:"slinks",style:"margin-top:18px"},[out,pw,...(ME.staff?[]:[lv])]))}
}
acctBtn.onclick=()=>open("acct");
/* 메일의 비밀번호 재설정 링크로 들어오면 새 비밀번호 화면을 열어요. 다른 탭에서 로그인/로그아웃해도 맞춰요 */
db.auth.onAuthStateChange(ev=>{setTimeout(async()=>{if(ev==="PASSWORD_RECOVERY"){await refreshMe();open("acct","newpw")}else if(ev==="SIGNED_IN"||ev==="SIGNED_OUT"){const had=!!ME;await refreshMe();if(had!==!!ME)draw();if(!had&&ME&&(!ME.name||!ME.phone||!ME.discord)&&sheet.hidden)open("acct","fill")}},0)});
cartBtn.onclick=()=>open("cart");lookBtn.onclick=()=>open("look");

async function load(){
  const adm=await isAdmin().catch(()=>false);await refreshMe();let pq=db.from("store_products").select("*");if(!adm)pq=pq.neq("status","draft");
  const [a,b]=await Promise.all([pq.order("sort").order("created_at",{ascending:false}),db.from("store_settings").select("*").eq("id",1).maybeSingle()]);
  P=(a.data||[]).filter(p=>adm||p.status!=="draft");S=(b&&b.data)||{};PREV=adm&&P.some(p=>p.status==="draft");
  /* 패키지에 적힌 담당들의 채널 작품 (최신 순) */
  const pages=[...new Set(P.filter(isPack).flatMap(p=>p.pack.parts.flatMap(pt=>(pt.who||[]).map(w=>w.page))).filter(Boolean))];IT={};
  if(pages.length)try{const {data}=await db.from("items").select("page,kind,url,caption,section,created_at").in("page",pages).order("created_at",{ascending:false});(data||[]).forEach(i=>(IT[i.page]=IT[i.page]||[]).push(i))}catch(_){}
  draw();cartBadge();
  const id=new URLSearchParams(location.search).get("p"),p=id&&P.find(x=>x.id===id);if(p&&sheet.hidden)open("detail",p)}
document.addEventListener("rif:lang",()=>{L=lng();t=T[L];labels();draw();if(!sheet.hidden)close()});
labels();load().then(ppReturn)})();
