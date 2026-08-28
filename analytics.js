/* Google Analytics (GA4) — smbi.dk
   Hentes fra hver side med én linje i <head>:
       <script src="/analytics.js"></script>
   Måle-ID'et står kun her, så det kan rettes ét sted. */
(function () {
  var maaleId = 'G-0KL0LJNL6H';

  // Tæl ikke eget arbejde med: lokal server (python3 -m http.server) og file://
  var vaert = location.hostname;
  if (vaert === '' || vaert === 'localhost' || vaert === '127.0.0.1' ||
      vaert === '[::1]' || vaert.slice(-6) === '.local') return;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + maaleId;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', maaleId);
})();
