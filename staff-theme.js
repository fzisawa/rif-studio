/* 사내 화면(인트라넷 · 어드민 · 서명 설정) 화면 테마
   - 기본은 홈페이지와 같은 밝은 화면이에요. '다크 모드'를 고르면 이 브라우저(앱)에서만 기억해요.
   - 이 파일은 <head> 에서 바로 실행돼서, 화면이 그려지기 전에 테마를 정해요 (깜빡임 없음). */
(function(){
  var H=document.documentElement,KEY="rif-staff-theme";
  var get=function(){try{return localStorage.getItem(KEY)==="dark"?"dark":"light"}catch(_){return "light"}};
  var paint=function(t){
    if(t==="dark")H.setAttribute("data-theme","dark");else H.removeAttribute("data-theme");
    var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="dark"?"#131316":"#ffffff")};
  var label=function(){return get()==="dark"?"밝은 화면으로":"다크 모드"};
  var set=function(t){try{localStorage.setItem(KEY,t)}catch(_){}paint(t);
    document.querySelectorAll("[data-thm]").forEach(function(b){b.textContent=label()});
    document.querySelectorAll("[data-thmi]").forEach(function(b){b.textContent=get()==="dark"?"☀️":"🌙"})};
  var flip=function(){set(get()==="dark"?"light":"dark")};
  paint(get());
  /* 다른 탭에서 바꾸면 같이 바뀌어요 */
  addEventListener("storage",function(e){if(e.key===KEY)set(get())});
  document.addEventListener("DOMContentLoaded",function(){
    paint(get());
    /* PC: '로그아웃' 옆에 전환 링크 */
    var out=document.getElementById("out");
    if(out&&out.parentNode&&!document.getElementById("thm")){
      var a=document.createElement("a");a.href="#";a.id="thm";a.setAttribute("data-thm","");a.setAttribute("role","button");a.textContent=label();
      a.addEventListener("click",function(e){e.preventDefault();flip()});
      out.after(document.createTextNode(" · "),a)}
    /* 휴대폰 앱 화면: '더보기' 창이 열릴 때 한 줄 추가 */
    new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){
      if(!n.classList||!n.classList.contains("ash-sheet"))return;var box=n.querySelector(".ash-sbox");if(!box||box.querySelector("[data-thm]"))return;
      var b=document.createElement("button"),i=document.createElement("span"),s=document.createElement("span");b.type="button";b.className="ash-row";
      i.className="ash-ic";i.setAttribute("data-thmi","");i.textContent=get()==="dark"?"☀️":"🌙";s.setAttribute("data-thm","");s.textContent=label();b.append(i,s);
      b.addEventListener("click",flip);
      var last=box.querySelector(".ash-row.out");if(last)box.insertBefore(b,last);else box.append(b)})})}).observe(document.body,{childList:true})});
})();
