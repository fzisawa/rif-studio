/* RIF STUDIO 인트라넷 음성 채팅
   - 소리는 직원 컴퓨터끼리 직접 주고받아요(WebRTC). 서버는 "누가 들어왔는지 · 연결 정보"만 전해 줘요(Supabase Realtime 비공개 채널).
   - 채널: voice:hall(회의실 · 모든 직원) · voice:room:<id>(채팅방 멤버) · voice:dm:<a>|<b>(1:1 통화) · voice:ring(통화 알림)
   - 누가 어느 채널에 들어갈 수 있는지는 DB(voice_topic_ok)가 정해요. */
window.RIFVOICE=(()=>{
const ICE=[{urls:["stun:stun.cloudflare.com:3478","stun:stun.l.google.com:19302"]}];
const KEY=()=>me+"#"+SID,SID=Math.random().toString(36).slice(2,10);
let cur=null,hall=null,ringCh=null,started=false,hallState=[],ringing=null,actx=null,meter=null;
const nm=e=>{try{return dispName(e)}catch(_){return e}};
const dmTopic=o=>"voice:dm:"+[me,String(o).toLowerCase()].sort().join("|");
const $v=i=>document.getElementById(i);
const t=s=>{try{toast(s)}catch(_){}};

/* ── 채널 ── */
function openCh(topic){
  const ch=db.channel(topic,{config:{private:true,presence:{key:KEY()},broadcast:{self:false}}});
  ch.on("presence",{event:"sync"},()=>{if(topic==="voice:hall"){hallState=people(ch);drawHall()}if(cur&&cur.topic===topic)sync()})
    .on("broadcast",{event:"sig"},({payload:p})=>{if(cur&&cur.topic===topic&&p&&p.to===KEY())signal(p)})
    .on("broadcast",{event:"bye"},({payload:p})=>{if(cur&&cur.topic===topic&&p)drop(p.from)});
  return ch}
const people=ch=>{const st=ch.presenceState(),out=[];Object.keys(st).forEach(k=>{const m=(st[k]||[])[0];if(m&&m.in)out.push({key:k,email:m.email,name:m.name,muted:!!m.muted})});return out};
const subscribe=ch=>new Promise(res=>{let done=false;ch.subscribe(s=>{if(done)return;if(s==="SUBSCRIBED"){done=true;res(true)}else if(s==="CHANNEL_ERROR"||s==="TIMED_OUT"||s==="CLOSED"){done=true;res(false)}})});

/* ── 들어가기 · 나가기 ── */
async function join(topic,label){
  if(cur&&cur.topic===topic)return;
  if(cur&&!confirm("지금 '"+cur.label+"'에 들어가 있어요. 나가고 '"+label+"'(으)로 옮길까요?"))return false;
  if(cur)await leave(true);
  let stream;
  try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false})}
  catch(e){t(/NotAllowed|Permission/i.test(e&&e.name||"")?"마이크 권한이 꺼져 있어요. 주소창 왼쪽 자물쇠에서 마이크를 허용해 주세요.":"마이크를 찾지 못했어요. 마이크가 연결돼 있는지 확인해 주세요.");return false}
  cur={topic,label,stream,peers:new Map(),muted:false,deaf:false,speak:new Set()};
  try{actx=new (window.AudioContext||window.webkitAudioContext)();await actx.resume()}catch(_){actx=null}
  watch("me",stream);
  let ch=topic==="voice:hall"?hall:null;
  if(!ch){ch=openCh(topic);if(!(await subscribe(ch))){db.removeChannel(ch);stopLocal();cur=null;drawBar();t("음성 채널에 들어가지 못했어요. 새로고침 후 다시 시도해 주세요.");return false}}
  cur.ch=ch;await track();drawBar();drawHall();
  if(!meter)meter=setInterval(levels,160);
  return true}
async function leave(quiet){
  if(!cur)return;const c=cur;cur=null;
  try{c.ch.send({type:"broadcast",event:"bye",payload:{from:KEY()}})}catch(_){}
  c.peers.forEach(p=>{try{p.pc.close()}catch(_){}if(p.au)p.au.remove()});
  try{await c.ch.untrack()}catch(_){}
  if(c.topic!=="voice:hall")try{db.removeChannel(c.ch)}catch(_){}
  c.stream.getTracks().forEach(x=>x.stop());
  try{actx&&actx.close()}catch(_){}actx=null;clearInterval(meter);meter=null;meters.clear();
  drawBar();drawHall();if(!quiet)t("음성 채널에서 나왔어요")}
function stopLocal(){if(cur)cur.stream.getTracks().forEach(x=>x.stop())}
const track=()=>cur&&cur.ch.track({in:true,email:me,name:myName||nm(me),muted:cur.muted});

/* ── 연결 (먼저 들어온 쪽이 아니라 이름 순서로 한쪽만 먼저 걸어서 엇갈리지 않게) ── */
function sync(){
  if(!cur||!cur.ch)return;const list=people(cur.ch),keys=new Set(list.map(p=>p.key));
  list.forEach(p=>{if(p.key!==KEY()&&!cur.peers.has(p.key)&&KEY()<p.key)peer(p.key,true)});
  [...cur.peers.keys()].forEach(k=>{if(!keys.has(k))drop(k)});
  cur.list=list;drawBar()}
function peer(k,init){
  const pc=new RTCPeerConnection({iceServers:ICE}),p={pc,q:[],au:null};cur.peers.set(k,p);
  cur.stream.getTracks().forEach(x=>pc.addTrack(x,cur.stream));
  pc.onicecandidate=e=>{if(e.candidate)send(k,{ice:e.candidate.toJSON()})};
  pc.ontrack=e=>{if(p.au)return;const a=document.createElement("audio");a.autoplay=true;a.playsInline=true;a.srcObject=e.streams[0];a.muted=!!(cur&&cur.deaf);
    $v("vaud").append(a);p.au=a;a.play().catch(()=>{});watch(k,e.streams[0])};
  pc.onconnectionstatechange=()=>{p.state=pc.connectionState;if(pc.connectionState==="failed")try{pc.restartIce()}catch(_){}drawBar()};
  if(init)(async()=>{try{await pc.setLocalDescription(await pc.createOffer());send(k,{sdp:pc.localDescription.toJSON()})}catch(e){console.warn(e)}})();
  return p}
async function signal(m){
  let p=cur.peers.get(m.from);if(!p)p=peer(m.from,false);const pc=p.pc;
  try{
    if(m.sdp){await pc.setRemoteDescription(m.sdp);
      if(m.sdp.type==="offer"){await pc.setLocalDescription(await pc.createAnswer());send(m.from,{sdp:pc.localDescription.toJSON()})}
      while(p.q.length)await pc.addIceCandidate(p.q.shift())}
    else if(m.ice){if(pc.remoteDescription)await pc.addIceCandidate(m.ice);else p.q.push(m.ice)}}
  catch(e){console.warn("voice",e)}}
function drop(k){if(!cur)return;const p=cur.peers.get(k);if(!p)return;try{p.pc.close()}catch(_){}if(p.au)p.au.remove();cur.peers.delete(k);cur.speak.delete(k);drawBar()}
const send=(to,x)=>{try{cur.ch.send({type:"broadcast",event:"sig",payload:{from:KEY(),to,...x}})}catch(_){}};

/* ── 말하는 사람 표시 ── */
const meters=new Map();
function watch(k,stream){if(!actx)return;try{const src=actx.createMediaStreamSource(stream),an=actx.createAnalyser();an.fftSize=512;src.connect(an);meters.set(k,{an,buf:new Uint8Array(an.fftSize)})}catch(_){}}
function levels(){if(!cur)return;let ch=false;
  meters.forEach((m,k)=>{if(k!=="me"&&!cur.peers.has(k)){meters.delete(k);return}m.an.getByteTimeDomainData(m.buf);let s=0;for(const v of m.buf){const d=v-128;s+=d*d}
    const on=Math.sqrt(s/m.buf.length)>6&&!(k==="me"&&cur.muted),kk=k==="me"?KEY():k;if(on!==cur.speak.has(kk)){on?cur.speak.add(kk):cur.speak.delete(kk);ch=true}});
  if(ch)paintSpeak()}
function paintSpeak(){document.querySelectorAll("#vbar .vp").forEach(x=>x.classList.toggle("sp",!!cur&&cur.speak.has(x.dataset.k)))}

/* ── 화면: 아래쪽 통화 막대 ── */
function drawBar(){
  if(lastHead&&lastHead.isConnected)decorate(lastHead,lastCtx);
  const b=$v("vbar");if(!b)return;if(!cur){b.hidden=true;b.replaceChildren();document.body.classList.remove("vin");return}
  document.body.classList.add("vin");b.hidden=false;
  const list=(cur.list&&cur.list.length?cur.list:[{key:KEY(),email:me,name:myName||nm(me),muted:cur.muted}]);
  const conn=[...cur.peers.values()].filter(p=>p.state==="connected").length,others=list.filter(p=>p.key!==KEY()).length;
  const st=others?(conn<others?"연결하는 중…":"연결됨"):(cur.topic.startsWith("voice:dm:")?"상대를 기다리는 중…":"혼자 있어요");
  const ps=el("div",{className:"vps"},list.map(p=>el("span",{className:"vp"+(p.muted?" mu":""),title:(p.name||nm(p.email))+(p.muted?" · 마이크 꺼짐":"")},[el("i",{textContent:(p.name||nm(p.email)||"?").slice(0,1)}),el("span",{textContent:(p.key===KEY()?"나":(p.name||nm(p.email)))})])));
  ps.querySelectorAll(".vp").forEach((x,i)=>x.dataset.k=list[i].key);
  const mic=el("button",{type:"button",className:"vb"+(cur.muted?" off":""),textContent:cur.muted?"🔇 마이크 꺼짐":"🎤 마이크",title:"마이크 켜기/끄기"});
  mic.onclick=()=>{cur.muted=!cur.muted;cur.stream.getAudioTracks().forEach(x=>x.enabled=!cur.muted);track();drawBar()};
  const spk=el("button",{type:"button",className:"vb"+(cur.deaf?" off":""),textContent:cur.deaf?"🔈 소리 꺼짐":"🔊 소리",title:"다른 사람 소리 켜기/끄기"});
  spk.onclick=()=>{cur.deaf=!cur.deaf;cur.peers.forEach(p=>{if(p.au)p.au.muted=cur.deaf});drawBar()};
  const out=el("button",{type:"button",className:"vb end",textContent:"나가기"});out.onclick=()=>leave();
  b.replaceChildren(el("div",{className:"vhd"},[el("b",{textContent:"🎙 "+cur.label}),el("span",{className:"note",textContent:st+" · "+list.length+"명"})]),ps,el("div",{className:"vbs"},[mic,spk,out]));
  paintSpeak()}

/* ── 화면: 채팅 왼쪽 위 회의실 카드 ── */
function drawHall(){
  const h=$v("vhall");if(!h)return;const inHall=cur&&cur.topic==="voice:hall";
  const names=hallState.map(p=>p.email===me?"나":(p.name||nm(p.email)));
  const b=el("button",{type:"button",className:"btn small"+(inHall?" ghost":""),textContent:inHall?"나가기":"참여"});b.onclick=()=>inHall?leave():join("voice:hall","회의실");
  h.replaceChildren(el("div",{className:"vht"},[el("b",{textContent:"🎙 회의실"}),el("span",{className:"note",textContent:names.length?names.join(", "):"아무도 없어요 · 들어가면 바로 말할 수 있어요"})]),b)}

/* ── 채팅 위쪽 버튼: 전체 → 회의실 · 채팅방 → 방 음성 · 1:1 → 통화 ── */
let lastHead=null,lastCtx=null;
function decorate(head,ctx){
  if(!head)return;lastHead=head;lastCtx=ctx;head.querySelectorAll(".vgo").forEach(x=>x.remove());let b;
  if(ctx.room){const tp="voice:room:"+ctx.room.id,on=cur&&cur.topic===tp;b=el("button",{type:"button",className:"ob2 vgo",textContent:on?"🎙 음성 나가기":"🎙 음성 참여"});b.onclick=()=>on?leave():join(tp,"👥 "+ctx.room.name)}
  else if(ctx.to&&ctx.to!==me){const tp=dmTopic(ctx.to),on=cur&&cur.topic===tp;b=el("button",{type:"button",className:"ob2 vgo",textContent:on?"📞 통화 끊기":"📞 음성 통화"});b.onclick=()=>on?leave():call(ctx.to)}
  else{const on=cur&&cur.topic==="voice:hall";b=el("button",{type:"button",className:"ob2 vgo",textContent:on?"🎙 회의실 나가기":"🎙 회의실 참여"});b.onclick=()=>on?leave():join("voice:hall","회의실")}
  head.append(b)}

/* ── 1:1 통화 · 통화 알림 ── */
let callT=null;
async function call(to){const tp=dmTopic(to);if(!(await join(tp,nm(to)+" 님과 통화")))return;
  try{ringCh.send({type:"broadcast",event:"ring",payload:{to:String(to).toLowerCase(),from:me,name:myName||nm(me),topic:tp}})}catch(_){}
  t("📞 "+nm(to)+" 님에게 거는 중…");clearTimeout(callT);
  callT=setTimeout(()=>{if(cur&&cur.topic===tp&&!(cur.list||[]).some(p=>p.key!==KEY())){leave(true);t(nm(to)+" 님이 받지 않았어요")}},45000)}
function onRing(p){
  if(!p||p.to!==me)return;if(cur&&cur.topic===p.topic)return;hideRing();
  const box=el("div",{className:"vring",role:"alertdialog"},[el("b",{textContent:"📞 "+(p.name||nm(p.from))+" 님의 음성 통화"}),el("div",{className:"vbs"},[])]);
  const ok=el("button",{type:"button",className:"btn small p",textContent:"받기"}),no=el("button",{type:"button",className:"btn small ghost",textContent:"거절"});
  ok.onclick=()=>{hideRing();join(p.topic,(p.name||nm(p.from))+" 님과 통화")};
  no.onclick=()=>{hideRing();try{ringCh.send({type:"broadcast",event:"decline",payload:{to:p.from,from:me,topic:p.topic}})}catch(_){}};
  box.lastChild.append(ok,no);document.body.append(box);ringing={box,p,beep:setInterval(beep,1400),stop:setTimeout(hideRing,40000)};beep();
  try{if(document.hidden&&window.Notification&&Notification.permission==="granted")new Notification("RIF STUDIO",{body:(p.name||nm(p.from))+" 님이 음성 통화를 걸었어요"})}catch(_){}}
function hideRing(){if(!ringing)return;clearInterval(ringing.beep);clearTimeout(ringing.stop);ringing.box.remove();ringing=null}
function beep(){try{const c=new (window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.frequency.value=660;g.gain.value=.06;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.25);setTimeout(()=>c.close(),600)}catch(_){}}

/* ── 시작 · 끝 ── */
async function start(){
  if(started||!window.RTCPeerConnection)return;started=true;
  if(!$v("vbar")){document.body.append(el("div",{id:"vbar",className:"vbar",hidden:true,role:"region",ariaLabel:"음성 채팅"}),el("div",{id:"vaud",hidden:true}))}
  const side=document.querySelector("#pc .cside");if(side&&!$v("vhall"))side.insertBefore(el("div",{id:"vhall",className:"vhall"}),side.querySelector("#cp"));
  hall=openCh("voice:hall");subscribe(hall).then(ok=>{if(!ok){const h=$v("vhall");if(h)h.hidden=true}});drawHall();
  ringCh=db.channel("voice:ring",{config:{private:true,broadcast:{self:false}}})
    .on("broadcast",{event:"ring"},({payload})=>onRing(payload))
    .on("broadcast",{event:"decline"},({payload:p})=>{if(p&&p.to===me&&cur&&cur.topic===p.topic){clearTimeout(callT);leave(true);t(nm(p.from)+" 님이 통화를 거절했어요")}});
  subscribe(ringCh);
  window.addEventListener("beforeunload",()=>{if(cur)leave(true)})}
async function stop(){await leave(true);hideRing();[hall,ringCh].forEach(c=>{try{c&&db.removeChannel(c)}catch(_){}});hall=ringCh=null;started=false;hallState=[]}
return {start,stop,decorate,join,leave,call,get active(){return cur&&cur.topic}}})();
