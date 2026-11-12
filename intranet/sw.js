/* RIF 인트라넷 서비스 워커 — 설치 가능하게만 하고, 로그인·데이터·스크립트는 절대 캐시하지 않아요(항상 최신). 오프라인일 때만 안내 화면. */
const OFF='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RIF 인트라넷</title><body style="font-family:sans-serif;background:#faf9f6;color:#1d1b22;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center"><div><h2>인터넷에 연결되어 있지 않아요</h2><p>연결을 확인한 뒤 다시 열어 주세요.</p><button onclick="location.reload()" style="padding:10px 20px;border-radius:99px;border:1px solid #7c5cd6;background:#fff;color:#7c5cd6;font-size:15px">다시 시도</button></div></body>';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const r=e.request;if(r.mode!=='navigate')return;
  e.respondWith(fetch(r).catch(()=>new Response(OFF,{headers:{'Content-Type':'text/html; charset=utf-8'}})))});
