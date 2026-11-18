/* ==========================================================================
   LANGIT BINTANG — tidak perlu diedit.
   Menggambar bintang kecil di kanvas yang bergerak perlahan ke bawah dan
   berkedip. Otomatis berhenti saat tab tidak aktif, dan jadi diam kalau
   pengunjung memilih "kurangi animasi" di sistemnya.
   ========================================================================== */

(function () {
  "use strict";

  var canvas = document.getElementById("stars");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var bintang = [];
  var lebar = 0;
  var tinggi = 0;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var kurangiGerak =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function bikinBintang() {
    var jumlah = Math.round((lebar * tinggi) / 11000);
    jumlah = Math.max(70, Math.min(260, jumlah));

    bintang = [];
    for (var i = 0; i < jumlah; i++) {
      bintang.push({
        x: Math.random() * lebar,
        y: Math.random() * tinggi,
        r: Math.random() * 1.4 + 0.4,
        v: Math.random() * 0.22 + 0.05,
        alfa: Math.random() * 0.5 + 0.3,
        kedip: Math.random() * Math.PI * 2,
        lajuKedip: Math.random() * 0.018 + 0.004,
      });
    }
  }

  function ukuran() {
    lebar = window.innerWidth;
    tinggi = window.innerHeight;

    canvas.width = Math.round(lebar * dpr);
    canvas.height = Math.round(tinggi * dpr);
    canvas.style.width = lebar + "px";
    canvas.style.height = tinggi + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bikinBintang();
  }

  function gambar() {
    ctx.clearRect(0, 0, lebar, tinggi);

    for (var i = 0; i < bintang.length; i++) {
      var b = bintang[i];
      b.kedip += b.lajuKedip;

      var a = b.alfa + Math.sin(b.kedip) * 0.24;
      if (a < 0.06) a = 0.06;
      if (a > 1) a = 1;

      ctx.beginPath();
      ctx.fillStyle = "rgba(232, 235, 238, " + a.toFixed(3) + ")";
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();

      /* bintang besar dikasih sedikit cahaya */
      if (b.r > 1.15) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(232, 235, 238, " + (a * 0.16).toFixed(3) + ")";
        ctx.arc(b.x, b.y, b.r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function gerak() {
    for (var i = 0; i < bintang.length; i++) {
      var b = bintang[i];
      b.y += b.v;

      if (b.y - b.r > tinggi) {
        b.y = -b.r;
        b.x = Math.random() * lebar;
      }
    }
  }

  var jalan = null;

  function loop() {
    gerak();
    gambar();
    jalan = window.requestAnimationFrame(loop);
  }

  function mulai() {
    if (kurangiGerak) {
      gambar();
      return;
    }
    if (!jalan) loop();
  }

  function berhenti() {
    if (jalan) {
      window.cancelAnimationFrame(jalan);
      jalan = null;
    }
  }

  ukuran();
  mulai();

  var tunda = null;
  window.addEventListener("resize", function () {
    if (tunda) window.clearTimeout(tunda);
    tunda = window.setTimeout(function () {
      berhenti();
      ukuran();
      mulai();
    }, 200);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) berhenti();
    else mulai();
  });
})();
