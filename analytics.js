/* Besøgstælling — smbi.dk
   Cloudflare Web Analytics: cookiefri. Der gemmes intet på den besøgendes
   udstyr, og der laves ingen genkendelse på tværs af besøg — derfor kræver
   den ingen samtykkedialog.

   Hentes fra hver side med én linje i <head>:
       <script src="/analytics.js"></script>

   Token'en står kun her, så den kan skiftes ét sted i stedet for i 52 filer.
   Den hentes i Cloudflare: Analytics & Logs → Web Analytics → Add a site →
   manuel opsætning (JS-snippet). Token'en er ikke en hemmelighed — den står
   i klartekst hos alle besøgende — så den må gerne ligge i git. */
(function () {
  var token = 'f49c99760bf64175af7710d1eb47b1ea';

  // Tæl ikke eget arbejde med: lokal server (python3 -m http.server) og file://
  var vaert = location.hostname;
  if (vaert === '' || vaert === 'localhost' || vaert === '127.0.0.1' ||
      vaert === '[::1]' || vaert.slice(-6) === '.local') return;

  // Samme element som Cloudflares eget snippet: type=module (moduler er
  // udskudte i sig selv) og token'en i data-cf-beacon, sat før indsættelsen,
  // så beacon'en kan finde den, når den kører.
  var s = document.createElement('script');
  s.type = 'module';
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', JSON.stringify({ token: token }));
  document.head.appendChild(s);
})();
