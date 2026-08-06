/**
 * NodeHunt — Demo Adsterra ad codes
 *
 * Paste each snippet into the Admin → Ads tab under its matching field
 * (popunder, socialbar, nativeBanner, banner728x90, banner468x90, banner320x50),
 * enable the placements you want, and Save.
 *
 * These render clearly-labelled placeholder boxes so you can verify:
 *  - correct slot placement (head / body / sticky)
 *  - responsive swapping (728x90 → 468x90 → 320x50) when resizing
 *  - sticky shows native on desktop and a banner on smaller screens
 */

export const demoCodes = {
  /** Injected above </head>. Logs to console and tries to open a demo popup once per session. */
  popunder: `<script>
(function(){
  console.info('[NodeHunt demo] Popunder injected above </head>. A real Adsterra popunder opens a new tab.');
  try {
    if (!sessionStorage.getItem('nodehunt_demo_popunder')) {
      sessionStorage.setItem('nodehunt_demo_popunder', '1');
      var w = window.open('', '_blank');
      if (w) { w.document.write('<h2 style="font-family:Arial,sans-serif">Demo popunder</h2><p style="font-family:Arial,sans-serif">This is where the Adsterra popunder target page would load.</p>'); }
    }
  } catch (e) {}
})();
</script>`,

  /** Injected just before </body>. Slides a purple bar in at the very bottom. */
  socialbar: `<script>
(function(){
  var bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;align-items:center;justify-content:center;gap:10px;padding:8px 12px;background:#312e81;color:#ffffff;font:13px/1.2 Arial,sans-serif;border-top:1px solid #6366f1;';
  bar.innerHTML = '<span style="background:#f59e0b;color:#000;font-weight:bold;padding:2px 6px;border-radius:4px;font-size:10px">DEMO</span> Adsterra Social Bar (slides in above the footer)';
  document.body.appendChild(bar);
})();
</script>`,

  /** Used by the sticky bottom bar on desktop (>=728px). */
  nativeBanner: `<script>
(function(){
  var box = document.createElement('div');
  box.style.cssText = 'width:100%;max-width:360px;height:120px;margin:0 auto;display:flex;flex-direction:column;justify-content:center;gap:4px;padding:0 14px;background:linear-gradient(135deg,#064e3b,#065f46);border:1px dashed #34d399;border-radius:12px;color:#ecfdf5;font-family:Arial,sans-serif;box-sizing:border-box;';
  box.innerHTML = '<span style="background:#f59e0b;color:#000;font-weight:bold;padding:2px 8px;border-radius:4px;font-size:10px;align-self:flex-start">DEMO</span><strong style="font-size:14px">Native banner title here</strong><span style="font-size:12px;opacity:.85">Adsterra native banner placeholder</span>';
  var c = document.currentScript;
  (c ? c.parentNode : document.body).appendChild(box);
})();
</script>`,

  /** Wide screens (>=728px). */
  banner728x90: `<script>
(function(){
  var box = document.createElement('div');
  box.style.cssText = 'width:100%;max-width:728px;height:90px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(135deg,#1e293b,#334155);border:1px dashed #f59e0b;border-radius:10px;color:#f8fafc;font-family:Arial,sans-serif;box-sizing:border-box;';
  box.innerHTML = '<span style="background:#f59e0b;color:#000;font-weight:bold;padding:2px 8px;border-radius:4px;font-size:11px">DEMO</span> Adsterra banner 728x90';
  var c = document.currentScript;
  (c ? c.parentNode : document.body).appendChild(box);
})();
</script>`,

  /** Medium screens (468px up to 728px). */
  banner468x90: `<script>
(function(){
  var box = document.createElement('div');
  box.style.cssText = 'width:100%;max-width:468px;height:90px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(135deg,#1e293b,#334155);border:1px dashed #f59e0b;border-radius:10px;color:#f8fafc;font-family:Arial,sans-serif;box-sizing:border-box;';
  box.innerHTML = '<span style="background:#f59e0b;color:#000;font-weight:bold;padding:2px 8px;border-radius:4px;font-size:11px">DEMO</span> Adsterra banner 468x90';
  var c = document.currentScript;
  (c ? c.parentNode : document.body).appendChild(box);
})();
</script>`,

  /** Small screens (<468px). Also used by the sticky bar below 728px. */
  banner320x50: `<script>
(function(){
  var box = document.createElement('div');
  box.style.cssText = 'width:100%;max-width:320px;height:50px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#1e293b,#334155);border:1px dashed #f59e0b;border-radius:10px;color:#f8fafc;font-family:Arial,sans-serif;box-sizing:border-box;';
  box.innerHTML = '<span style="background:#f59e0b;color:#000;font-weight:bold;padding:2px 8px;border-radius:4px;font-size:10px">DEMO</span> Adsterra 320x50';
  var c = document.currentScript;
  (c ? c.parentNode : document.body).appendChild(box);
})();
</script>`,
};

/** Prints all codes to the console for easy copying. */
if (typeof console !== 'undefined') {
  Object.entries(demoCodes).forEach(([name, code]) => console.log(`\n/* ${name} */\n${code}`));
}
