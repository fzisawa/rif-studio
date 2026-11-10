/* 점검 안내: config.js 의 RIF.MAINT = {join:true, contact:true} 를 false 로 바꾸면 원래대로 돌아와요. */
(function(){
  var m=(window.RIF||{}).MAINT||{},p=/\/join\b/.test(location.pathname)?"join":/\/contact\b/.test(location.pathname)?"contact":"";
  if(!p||!m[p])return;
  var css=document.createElement("style");
  css.textContent="main>*:not(.mt){display:none!important}.mt{padding:12vh 0;text-align:center}.mt h1{margin:.2em 0}.mt p.lead{max-width:34em;margin:1em auto 0}[data-l]{display:none}html[lang=ko] [data-l=ko],html[lang=ja] [data-l=ja],html[lang=en] [data-l=en]{display:inline}";
  document.head.appendChild(css);
  function go(){
    var main=document.querySelector("main");if(!main||main.querySelector(".mt"))return;
    var s=document.createElement("section");s.className="hero mt";
    s.innerHTML='<p class="tag">'+(p==="join"?"JOIN US":"CONTACT")+'</p>'+
      '<h1><span data-l="ko">점검 중입니다</span><span data-l="ja">メンテナンス中です</span><span data-l="en">Under maintenance</span></h1>'+
      '<p class="lead"><span data-l="ko">더 나은 모습으로 곧 다시 열게요.<br>잠시만 기다려 주세요.</span><span data-l="ja">より良い形で、まもなく再開します。<br>いましばらくお待ちください。</span><span data-l="en">We\'ll be back soon, better than before.<br>Thank you for your patience.</span></p>';
    main.insertBefore(s,main.firstChild);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go();
})();
