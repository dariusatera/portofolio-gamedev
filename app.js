/* ==========================================================================
   MOTOR TAMPILAN — tidak perlu diedit.
   File ini membaca data dari content.js lalu menyusun halamannya.
   ========================================================================== */

(function () {
  "use strict";

  if (typeof konten === "undefined") {
    document.getElementById("app").innerHTML =
      '<p style="padding:40px;font-family:sans-serif">File content.js tidak ditemukan.</p>';
    return;
  }

  /* --- alat bantu kecil --- */

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function media(src, alt, label) {
    if (src) {
      return (
        '<img src="' +
        esc(src) +
        '" alt="' +
        esc(alt || label || "") +
        '" loading="lazy" />'
      );
    }
    return '<div class="placeholder"><span>' + esc(label || "Gambar menyusul") + "</span></div>";
  }

  function linkButton(link, cls) {
    if (!link || !link.teks) return "";
    var external = /^https?:/i.test(link.url || "");
    var target = external ? ' target="_blank" rel="noopener noreferrer"' : "";
    return (
      '<a class="btn ' +
      cls +
      '" href="' +
      esc(link.url || "#") +
      '"' +
      target +
      "><span>" +
      esc(link.teks) +
      '</span><span class="arrow" aria-hidden="true">→</span></a>'
    );
  }

  /* Gambar yang gagal dimuat (file hilang / path salah) diganti kotak placeholder
     supaya tidak muncul ikon gambar rusak. */
  document.addEventListener(
    "error",
    function (ev) {
      var img = ev.target;
      if (!img || img.tagName !== "IMG" || img.dataset.gagal) return;

      img.dataset.gagal = "1";

      var box = document.createElement("div");
      box.className = "placeholder";
      var label = document.createElement("span");
      label.textContent = img.getAttribute("alt") || "Gambar tidak ditemukan";
      box.appendChild(label);

      if (img.parentNode) img.parentNode.replaceChild(box, img);
    },
    true
  );

  var id = konten.identitas || {};

  /* --- header --- */

  var navItems = [
    { teks: "Game", url: "#game" },
    { teks: "Tentang", url: "#tentang" },
    { teks: "Galeri", url: "#galeri" },
    { teks: "Kontak", url: "#kontak" },
  ];

  var headerHTML =
    '<header class="site-header" id="header">' +
    '<div class="container">' +
    '<a class="brand" href="#atas">' +
    '<span class="brand-mark">' +
    esc(id.inisial || "GB") +
    "</span>" +
    "<span>" +
    esc(id.nama || "Nama Studio") +
    "</span>" +
    "</a>" +
    '<nav class="nav">' +
    navItems
      .map(function (item) {
        return '<a href="' + item.url + '">' + item.teks + "</a>";
      })
      .join("") +
    "</nav>" +
    linkButton(id.tombolHeader, "btn-ghost btn-sm") +
    "</div>" +
    "</header>";

  /* --- pembuka --- */

  var p = konten.pembuka || {};

  var heroHTML =
    '<section class="hero reveal" id="atas">' +
    '<div class="container">' +
    "<div>" +
    '<span class="eyebrow">' +
    esc(p.label || "Portofolio Game") +
    "</span>" +
    "<h1>" +
    esc(p.judul) +
    "</h1>" +
    '<p class="hero-sub">' +
    esc(p.subjudul) +
    "</p>" +
    '<div class="hero-actions">' +
    linkButton(p.tombolUtama, "btn-primary") +
    linkButton(p.tombolKedua, "btn-ghost") +
    "</div>" +
    "</div>" +
    '<div class="media hero-media">' +
    media(p.gambar, p.judul, "Screenshot utama") +
    "</div>" +
    "</div>" +
    "</section>";

  /* --- statistik --- */

  var statsHTML =
    '<section class="stats"><div class="container">' +
    (konten.statistik || [])
      .map(function (s) {
        return (
          '<div class="stat"><strong>' +
          esc(s.angka) +
          "</strong><span>" +
          esc(s.label) +
          "</span></div>"
        );
      })
      .join("") +
    "</div></section>";

  /* --- daftar game --- */

  var games = konten.game || [];

  var gameCards = games
    .map(function (g) {
      var featured = !!g.unggulan;
      var links = (g.tautan || []).map(function (t) {
        return linkButton(t, "btn-ghost btn-sm");
      });
      if (g.trailer) {
        links.push(
          '<a class="btn btn-ghost btn-sm" href="' +
            esc(g.trailer) +
            '" target="_blank" rel="noopener noreferrer"><span>Tonton Trailer</span></a>'
        );
      }

      return (
        '<article class="card reveal' +
        (featured ? " featured" : "") +
        '">' +
        '<div class="card-media">' +
        media(g.gambar, g.judul + " — " + (g.genre || ""), g.judul) +
        "</div>" +
        '<div class="card-body">' +
        '<div class="card-top">' +
        '<span class="pill">' +
        esc(g.status || "Dalam Pengerjaan") +
        "</span>" +
        '<span class="meta">' +
        esc(g.genre || "") +
        (g.tahun ? " · " + esc(g.tahun) : "") +
        "</span>" +
        "</div>" +
        "<h3>" +
        esc(g.judul) +
        "</h3>" +
        "<p>" +
        esc(g.deskripsi) +
        "</p>" +
        (links.length ? '<div class="card-links">' + links.join("") + "</div>" : "") +
        "</div>" +
        "</article>"
      );
    })
    .join("");

  var gamesListHTML = games.length
    ? '<div class="games-grid">' + gameCards + "</div>"
    : '<div class="empty-note reveal">' +
      "<p>Belum ada karya yang ditampilkan.</p>" +
      '<p class="empty-hint">Buka <a href="tambah.html">halaman Tambah Porto</a> untuk membuat kartu karya, lalu tempel kodenya ke <code>content.js</code>.</p>' +
      "</div>";

  var gamesHTML =
    '<section id="game"><div class="container">' +
    '<div class="section-head reveal">' +
    "<div>" +
    '<span class="eyebrow">Karya</span>' +
    "<h2>Game yang sudah dan sedang dibuat</h2>" +
    "</div>" +
    '<p class="lead" style="max-width:34ch">Setiap game punya ide inti yang jelas dan bisa diselesaikan tanpa panduan.</p>' +
    "</div>" +
    gamesListHTML +
    "</div></section>";

  /* --- tentang --- */

  var t = konten.tentang || {};

  var aboutHTML =
    '<section class="about" id="tentang"><div class="container">' +
    '<div class="media about-media reveal">' +
    media(t.gambar, t.judul, "Foto studio") +
    "</div>" +
    '<div class="about-body reveal">' +
    '<span class="eyebrow">' +
    esc(t.label || "Tentang") +
    "</span>" +
    "<h2 style=\"margin-bottom:24px;font-size:clamp(1.85rem,3.2vw,2.6rem)\">" +
    esc(t.judul) +
    "</h2>" +
    (t.paragraf || [])
      .map(function (par) {
        return "<p>" + esc(par) + "</p>";
      })
      .join("") +
    '<div class="skills">' +
    (t.keahlian || [])
      .map(function (k) {
        return '<span class="skill">' + esc(k) + "</span>";
      })
      .join("") +
    "</div>" +
    "</div>" +
    "</div></section>";

  /* --- galeri --- */

  var gal = konten.galeri || {};

  /* Kumpulkan item galeri: dari konten.galeri.item + screenshots tiap game */
  var galItems = (gal.item || []).slice();
  (konten.game || []).forEach(function (g) {
    if (!Array.isArray(g.screenshots)) return;
    g.screenshots.forEach(function (s) {
      if (s && s.gambar) {
        galItems.push({
          judul: (s.judul || g.judul || "Screenshot"),
          gambar: s.gambar,
          dari: g.judul, // nama game asal
        });
      }
    });
  });

  var galleryHTML =
    '<section id="galeri"><div class="container">' +
    '<div class="section-head reveal">' +
    "<div>" +
    '<span class="eyebrow">' +
    esc(gal.label || "Galeri") +
    "</span>" +
    "<h2>" +
    esc(gal.judul) +
    "</h2>" +
    "</div>" +
    '<p class="lead" style="max-width:32ch">' +
    esc(gal.keterangan || "") +
    "</p>" +
    "</div>" +
    (galItems.length
      ? '<div class="gallery-grid">' +
        galItems
          .map(function (item) {
            var label = item.judul + (item.dari ? " — " + item.dari : "");
            var inner = item.gambar
              ? '<a href="' + esc(item.gambar) + '" target="_blank" rel="noopener noreferrer">' +
                '<img src="' + esc(item.gambar) + '" alt="' + esc(label) + '" loading="lazy" />' +
                "</a>"
              : media("", item.judul, item.judul);
            return (
              '<figure class="gallery-item reveal" style="margin:0">' +
              inner +
              '<figcaption class="gallery-caption">' +
              esc(label) +
              "</figcaption>" +
              "</figure>"
            );
          })
          .join("") +
        "</div>"
      : '<p class="lead" style="color:var(--faint);margin-top:12px">Belum ada screenshot. Tambah lewat halaman <a href="tambah.html" style="color:var(--muted);text-decoration:underline">Tambah Porto</a>.</p>'
    ) +
    "</div></section>";

  /* --- kontak --- */

  var k = konten.kontak || {};

  var contactHTML =
    '<section id="kontak"><div class="container">' +
    '<div class="contact-panel reveal">' +
    "<div>" +
    '<span class="eyebrow">' +
    esc(k.label || "Kontak") +
    "</span>" +
    "<h2>" +
    esc(k.judul) +
    "</h2>" +
    '<p class="lead">' +
    esc(k.deskripsi) +
    "</p>" +
    linkButton(k.tombol, "btn-primary") +
    "</div>" +
    '<div class="contact-links">' +
    (k.tautan || [])
      .map(function (l) {
        var external = /^https?:/i.test(l.url || "");
        return (
          '<a href="' +
          esc(l.url || "#") +
          '"' +
          (external ? ' target="_blank" rel="noopener noreferrer"' : "") +
          "><span>" +
          esc(l.teks) +
          '</span><span aria-hidden="true">↗</span></a>'
        );
      })
      .join("") +
    "</div>" +
    "</div>" +
    "</div></section>";

  /* --- footer --- */

  var footerHTML =
    '<footer class="site-footer"><div class="container">' +
    "<span>" +
    esc(konten.footer || "") +
    "</span>" +
    '<a class="footer-admin" href="tambah.html">+ Tambah / edit porto</a>' +
    '<a class="to-top" href="#atas">Kembali ke atas <span aria-hidden="true">↑</span></a>' +
    "</div></footer>";

  var app = document.getElementById("app");
  app.innerHTML =
    headerHTML + "<main>" + heroHTML + statsHTML + gamesHTML + aboutHTML + galleryHTML + contactHTML + "</main>" + footerHTML;

  /* --- efek saat scroll --- */

  var header = document.getElementById("header");
  function onScroll() {
    if (window.scrollY > 8) header.classList.add("is-stuck");
    else header.classList.remove("is-stuck");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    items.forEach(function (item) {
      io.observe(item);
    });
  } else {
    items.forEach(function (item) {
      item.classList.add("is-in");
    });
  }
})();
