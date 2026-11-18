/* ==========================================================================
   ALAT BANTU PORTO — tidak perlu diedit.
   Mengelola daftar karya (tambah, edit, hapus), menampilkan pratinjau kartu,
   lalu membuat seluruh blok "game: [...]" untuk ditempel di content.js.
   Halaman ini tidak mengubah file apa pun.
   ========================================================================== */

(function () {
  "use strict";

  var KEY_FORM = "tambahPortoForm";
  var KEY_LIST = "tambahPortoList";
  var MAX_TAUTAN = 4;
  var MAX_SHOTS = 8;

  var form = document.getElementById("form");
  if (!form) return;

  /* penanda untuk halaman: alat bantu berhasil dimuat */
  window.__TAMBAH_SIAP = true;

  var f = {
    judul: document.getElementById("judul"),
    genre: document.getElementById("genre"),
    status: document.getElementById("status"),
    tahun: document.getElementById("tahun"),
    deskripsi: document.getElementById("deskripsi"),
    gambar: document.getElementById("gambar"),
    gambarFile: document.getElementById("gambarFile"),
    trailer: document.getElementById("trailer"),
    unggulan: document.getElementById("unggulan"),
  };

  /* ---------- screenshots ---------- */
  var shots = []; // array of { judul: string, data: string (base64 or path) }
  var shotDropZone = document.getElementById("shotDropZone");
  var shotDropInner = document.getElementById("shotDropInner");
  var shotGrid = document.getElementById("shotGrid");
  var shotFiles = document.getElementById("shotFiles");
  var shotStatus = document.getElementById("shotStatus");

  var tautanList = document.getElementById("tautanList");
  var listEl = document.getElementById("entryList");
  var listTitle = document.getElementById("listTitle");
  var listNote = document.getElementById("listNote");
  var syncBtn = document.getElementById("syncFromFile");
  var output = document.getElementById("output");
  var copyBtn = document.getElementById("copyBtn");
  var resetBtn = document.getElementById("resetForm");
  var cancelEditBtn = document.getElementById("cancelEdit");
  var submitLabel = document.getElementById("submitLabel");
  var formTitle = document.getElementById("formTitle");
  var statusLine = document.getElementById("formStatus");
  var draftNote = document.getElementById("draftNote");
  var clearDraftBtn = document.getElementById("clearDraft");

  var preview = {
    media: document.getElementById("previewMedia"),
    status: document.getElementById("previewStatus"),
    meta: document.getElementById("previewMeta"),
    judul: document.getElementById("previewJudul"),
    deskripsi: document.getElementById("previewDeskripsi"),
    links: document.getElementById("previewLinks"),
  };

  var dropZone = document.getElementById("dropZone");
  var dropPreview = document.getElementById("dropPreview");
  var dropInner = document.getElementById("dropInner");
  var dropActions = document.getElementById("dropActions");
  var gambarInfo = document.getElementById("gambarInfo");
  var hapusGambarBtn = document.getElementById("hapusGambar");

  var entri = [];
  var editing = -1;

  /* ---------- alat bantu ---------- */

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function val(input) {
    return (input.value || "").trim();
  }

  function quote(text) {
    return String(text)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\r?\n+/g, " ")
      .trim();
  }

  function setStatus(text, kind) {
    statusLine.textContent = text || "";
    statusLine.className = "form-status" + (kind ? " is-" + kind : "");
  }

  /* ---------- screenshot helpers ---------- */

  function setShotStatus(text, kind) {
    if (!shotStatus) return;
    shotStatus.textContent = text || "";
    shotStatus.className = "form-status" + (kind ? " is-" + kind : "");
  }

  function renderShotGrid() {
    if (!shotGrid) return;
    if (!shots.length) {
      shotGrid.innerHTML = "";
      shotGrid.style.display = "none";
      return;
    }
    shotGrid.style.display = "grid";
    shotGrid.innerHTML = shots
      .map(function (s, i) {
        var src = s.data;
        var isPath = src.indexOf("data:") !== 0;
        var info = isPath ? s.data : (Math.round(src.length / 1024) + " KB");
        return (
          '<div class="shot-item">' +
          '<img src="' + (isPath ? src : src) + '" alt="' + esc(s.judul) + '" />' +
          '<div class="shot-item-body">' +
          '<input class="shot-title-input" type="text" value="' + esc(s.judul) + '" placeholder="Judul screenshot" data-index="' + i + '" />' +
          '<span class="shot-info">' + esc(info) + '</span>' +
          '</div>' +
          '<button type="button" class="shot-remove" data-index="' + i + '" aria-label="Hapus screenshot">×</button>' +
          '</div>'
        );
      })
      .join("");

    // bind events
    Array.prototype.forEach.call(shotGrid.querySelectorAll(".shot-remove"), function (btn) {
      btn.addEventListener("click", function () {
        var idx = Number(btn.getAttribute("data-index"));
        shots.splice(idx, 1);
        renderShotGrid();
        updateOutput();
        setShotStatus("Screenshot dihapus.", "ok");
      });
    });

    Array.prototype.forEach.call(shotGrid.querySelectorAll(".shot-title-input"), function (inp) {
      inp.addEventListener("input", function () {
        var idx = Number(inp.getAttribute("data-index"));
        if (shots[idx]) shots[idx].judul = inp.value;
        updateOutput();
      });
    });
  }

  function kecilkanShot(file) {
    return new Promise(function (selesai, gagal) {
      // GIF: embed as-is (no canvas support for animated gif)
      if (file.type === "image/gif") {
        if (file.size > 5 * 1024 * 1024) {
          gagal(new Error('GIF "' + file.name + '" lebih dari 5 MB, dilewati.'));
          return;
        }
        var reader = new FileReader();
        reader.onload = function (e) { selesai({ data: e.target.result, lebar: 0, tinggi: 0 }); };
        reader.onerror = function () { gagal(new Error('Gagal baca "' + file.name + '".')); };
        reader.readAsDataURL(file);
        return;
      }

      if (file.size > 15 * 1024 * 1024) {
        gagal(new Error('File "' + file.name + '" lebih dari 15 MB, dilewati.'));
        return;
      }

      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var lebar = img.naturalWidth;
        var tinggi = img.naturalHeight;
        var BATAS = 600 * 1024;
        var langkah = [[1200, 0.82], [900, 0.75], [700, 0.68]];
        var hasil = null;
        for (var i = 0; i < langkah.length; i++) {
          var skala = Math.min(1, langkah[i][0] / lebar);
          var w = Math.max(1, Math.round(lebar * skala));
          var h = Math.max(1, Math.round(tinggi * skala));
          var canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          var data = canvas.toDataURL("image/webp", langkah[i][1]);
          if (data.indexOf("data:image/") !== 0) data = canvas.toDataURL("image/jpeg", langkah[i][1]);
          hasil = { data: data, lebar: w, tinggi: h };
          if (data.length <= BATAS) break;
        }
        URL.revokeObjectURL(url);
        selesai(hasil);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        gagal(new Error('Gagal baca "' + file.name + '"'));
      };
      img.src = url;
    });
  }

  function prosesShots(files) {
    var arr = Array.prototype.slice.call(files);
    var sisa = MAX_SHOTS - shots.length;
    if (sisa <= 0) {
      setShotStatus("Sudah mencapai batas " + MAX_SHOTS + " gambar.", "error");
      return;
    }
    arr = arr.slice(0, sisa);
    var selesai = 0;
    var gagalList = [];
    setShotStatus("Memproses " + arr.length + " gambar…");

    arr.forEach(function (file) {
      kecilkanShot(file).then(
        function (hasil) {
          shots.push({
            judul: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
            data: hasil.data,
          });
          selesai++;
          if (selesai + gagalList.length === arr.length) selesaikan();
        },
        function (err) {
          gagalList.push(err.message);
          selesai++;
          if (selesai === arr.length) selesaikan();
        }
      );
    });

    function selesaikan() {
      renderShotGrid();
      updateOutput();
      var msg = shots.length + " screenshot siap.";
      if (gagalList.length) msg += " Gagal: " + gagalList.join(", ");
      setShotStatus(msg, gagalList.length ? "error" : "ok");
    }
  }

  if (shotDropZone) {
    shotDropZone.addEventListener("click", function () { shotFiles.click(); });
    shotDropZone.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); shotFiles.click(); }
    });
    ["dragenter", "dragover"].forEach(function (n) {
      shotDropZone.addEventListener(n, function (ev) { ev.preventDefault(); shotDropZone.classList.add("is-drag"); });
    });
    ["dragleave", "dragend"].forEach(function (n) {
      shotDropZone.addEventListener(n, function () { shotDropZone.classList.remove("is-drag"); });
    });
    shotDropZone.addEventListener("drop", function (ev) {
      ev.preventDefault();
      shotDropZone.classList.remove("is-drag");
      var files = ev.dataTransfer && ev.dataTransfer.files;
      if (files && files.length) prosesShots(files);
    });
  }

  if (shotFiles) {
    shotFiles.addEventListener("change", function () {
      if (shotFiles.files && shotFiles.files.length) prosesShots(shotFiles.files);
      shotFiles.value = "";
    });
  }

  function resetShots() {
    shots = [];
    renderShotGrid();
  }

  function bacaStore(key) {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function tulisStore(key, nilai) {
    try {
      localStorage.setItem(key, nilai);
      return true;
    } catch (err) {
      /* penyimpanan lokal penuh atau tidak tersedia */
      return false;
    }
  }

  function hapusStore(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      /* abaikan */
    }
  }

  /* ---------- data karya ---------- */

  function rapikan(data) {
    data = data || {};
    var tautan = Array.isArray(data.tautan) ? data.tautan : [];
    var screenshots = Array.isArray(data.screenshots) ? data.screenshots : [];

    return {
      judul: String(data.judul || "").trim(),
      genre: String(data.genre || "").trim(),
      status: String(data.status || "").trim() || "Konsep",
      tahun: String(data.tahun || "").trim(),
      deskripsi: String(data.deskripsi || "").trim(),
      gambar: String(data.gambar || "").trim(),
      trailer: String(data.trailer || "").trim(),
      unggulan: !!data.unggulan,
      tautan: tautan
        .slice(0, MAX_TAUTAN)
        .map(function (t) {
          return {
            teks: String((t && t.teks) || "").trim(),
            url: String((t && t.url) || "").trim() || "#",
          };
        })
        .filter(function (t) { return t.teks; }),
      screenshots: screenshots
        .slice(0, MAX_SHOTS)
        .map(function (s) {
          return {
            judul: String((s && s.judul) || "").trim(),
            data: String((s && s.data) || "").trim(),
          };
        })
        .filter(function (s) { return s.data; }),
    };
  }

  /* Daftar yang sedang ada di content.js (file ini dimuat lebih dulu) */
  function entriDariFile() {
    if (typeof konten === "undefined" || !konten || !konten.game) return [];
    if (!Array.isArray(konten.game)) return [];
    return konten.game
      .map(rapikan)
      .filter(function (e) {
        return e.judul;
      });
  }

  function simpanDaftar() {
    var tersimpan = tulisStore(KEY_LIST, JSON.stringify(entri));

    if (tersimpan) {
      listNote.textContent = entri.length
        ? "Daftar ini tersimpan di browser ini. Klik Salin semua kode untuk memindahkannya ke content.js."
        : "Belum ada karya. Isi form di kiri, lalu klik Simpan ke daftar.";
    } else {
      listNote.textContent =
        "Daftar terlalu besar untuk disimpan otomatis di browser (gambar terlalu besar). Kode tetap bisa disalin — segera tempel ke content.js.";
    }

    return tersimpan;
  }

  /* ---------- daftar tautan ---------- */

  function addRow(teks, url) {
    if (tautanList.children.length >= MAX_TAUTAN) {
      setStatus("Tautan tambahan maksimal " + MAX_TAUTAN + ".", "error");
      return;
    }

    var row = document.createElement("div");
    row.className = "repeat-row";
    row.innerHTML =
      '<input type="text" class="tautan-teks" placeholder="Teks tombol, mis: Halaman Steam" autocomplete="off" />' +
      '<input type="url" class="tautan-url" placeholder="https://..." autocomplete="off" />' +
      '<button type="button" class="repeat-remove" aria-label="Hapus tautan" title="Hapus tautan">×</button>';

    row.querySelector(".tautan-teks").value = teks || "";
    row.querySelector(".tautan-url").value = url || "";
    row.querySelector(".repeat-remove").addEventListener("click", function () {
      row.parentNode.removeChild(row);
      sync();
    });

    tautanList.appendChild(row);
  }

  function readTautan() {
    var hasil = [];
    Array.prototype.forEach.call(tautanList.querySelectorAll(".repeat-row"), function (row) {
      var teks = row.querySelector(".tautan-teks").value.trim();
      var url = row.querySelector(".tautan-url").value.trim();
      if (teks) hasil.push({ teks: teks, url: url || "#" });
    });
    return hasil;
  }

  function readTautanMentah() {
    return Array.prototype.map.call(tautanList.querySelectorAll(".repeat-row"), function (row) {
      return {
        teks: row.querySelector(".tautan-teks").value,
        url: row.querySelector(".tautan-url").value,
      };
    });
  }

  /* ---------- form -> data ---------- */

  function entriDariForm() {
    return rapikan({
      judul: val(f.judul),
      genre: val(f.genre),
      status: val(f.status),
      tahun: val(f.tahun),
      deskripsi: val(f.deskripsi),
      gambar: val(f.gambar),
      trailer: val(f.trailer),
      unggulan: f.unggulan.checked,
      tautan: readTautan(),
      screenshots: shots.slice(),
    });
  }

  function isiForm(data) {
    f.judul.value = data.judul || "";
    f.genre.value = data.genre || "";
    f.status.value = data.status || "";
    f.tahun.value = data.tahun || "";
    f.deskripsi.value = data.deskripsi || "";
    f.gambar.value = data.gambar || "";
    f.trailer.value = data.trailer || "";
    f.unggulan.checked = !!data.unggulan;

    tautanList.innerHTML = "";
    (data.tautan || []).forEach(function (t) { addRow(t.teks, t.url); });

    shots = (data.screenshots || []).slice();
    renderShotGrid();
  }

  function kosongkanForm() {
    form.reset();
    f.unggulan.checked = false;
    tautanList.innerHTML = "";
    addRow("", "");
    resetShots();
    hapusStore(KEY_FORM);
  }

  function terapkanMode() {
    if (editing >= 0 && entri[editing]) {
      formTitle.textContent = 'Edit karya — "' + entri[editing].judul + '"';
      submitLabel.textContent = "Simpan perubahan";
      cancelEditBtn.hidden = false;
    } else {
      formTitle.textContent = "Data karya baru";
      submitLabel.textContent = "Simpan ke daftar";
      cancelEditBtn.hidden = true;
    }
  }

  /* ---------- pratinjau kartu ---------- */

  function renderPreview() {
    var judul = val(f.judul) || "Judul karya";
    var genre = val(f.genre);
    var tahun = val(f.tahun);
    var gambar = val(f.gambar);

    preview.media.innerHTML = gambar
      ? '<img src="' + esc(gambar) + '" alt="' + esc(judul) + '" />'
      : '<div class="placeholder"><span>' + esc(judul) + "</span></div>";

    preview.status.textContent = val(f.status) || "Konsep";
    preview.meta.textContent = genre + (tahun ? (genre ? " · " : "") + tahun : "");
    preview.judul.textContent = judul;
    preview.deskripsi.textContent =
      val(f.deskripsi) || "Deskripsi singkat akan muncul di sini.";

    var links = readTautan().map(function (t) {
      return (
        '<a class="btn btn-ghost btn-sm" href="' +
        esc(t.url) +
        '" target="_blank" rel="noopener noreferrer"><span>' +
        esc(t.teks) +
        "</span></a>"
      );
    });

    if (val(f.trailer)) {
      links.push(
        '<a class="btn btn-ghost btn-sm" href="' +
          esc(val(f.trailer)) +
          '" target="_blank" rel="noopener noreferrer"><span>Tonton Trailer</span></a>'
      );
    }

    preview.links.innerHTML = links.join("");
  }

  /* ---------- gambar cover (drop / pilih file) ---------- */

  var MAX_LEBAR = 1200;
  var BATAS_DATA = 700 * 1024;
  var MAKS_FILE = 15 * 1024 * 1024;

  function kecilkanGambar(file) {
    return new Promise(function (selesai, gagal) {
      if (!file || !file.type || file.type.indexOf("image/") !== 0) {
        gagal(new Error("File itu bukan gambar (jpg, png, atau webp)."));
        return;
      }
      if (file.size > MAKS_FILE) {
        gagal(new Error("Gambarnya lebih dari 15 MB. Kecilkan dulu, lalu coba lagi."));
        return;
      }

      var url = URL.createObjectURL(file);
      var img = new Image();

      img.onload = function () {
        var lebar = img.naturalWidth || img.width;
        var tinggi = img.naturalHeight || img.height;

        function render(maksLebar, mutu) {
          var skala = Math.min(1, maksLebar / lebar);
          var w = Math.max(1, Math.round(lebar * skala));
          var h = Math.max(1, Math.round(tinggi * skala));
          var canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);

          var data = canvas.toDataURL("image/webp", mutu);
          if (data.indexOf("data:image/") !== 0) data = canvas.toDataURL("image/jpeg", mutu);

          return { data: data, lebar: w, tinggi: h };
        }

        var langkah = [
          [MAX_LEBAR, 0.82],
          [1000, 0.75],
          [820, 0.68],
        ];
        var hasil = null;

        for (var i = 0; i < langkah.length; i++) {
          hasil = render(langkah[i][0], langkah[i][1]);
          if (hasil.data.length <= BATAS_DATA) break;
        }

        URL.revokeObjectURL(url);
        selesai(hasil);
      };

      img.onerror = function () {
        URL.revokeObjectURL(url);
        gagal(new Error("Gambarnya tidak bisa dibaca. Coba file lain."));
      };

      img.src = url;
    });
  }

  function pakaiFile(file) {
    setStatus("Memproses gambar…");

    kecilkanGambar(file).then(
      function (hasil) {
        f.gambar.value = hasil.data;
        sync();
        setStatus(
          "Gambar siap (" +
            hasil.lebar +
            "×" +
            hasil.tinggi +
            ", sekitar " +
            Math.round(hasil.data.length / 1024) +
            " KB) dan ikut tersimpan di content.js.",
          "ok"
        );
      },
      function (err) {
        setStatus(err.message, "error");
      }
    );
  }

  function renderDrop() {
    var nilai = val(f.gambar);

    if (nilai) {
      dropPreview.hidden = false;
      if (dropPreview.getAttribute("src") !== nilai) dropPreview.src = nilai;
      dropZone.classList.add("has-image");
      dropInner.hidden = true;
      dropActions.hidden = false;
      gambarInfo.textContent =
        nilai.indexOf("data:image/") === 0
          ? "Gambar ditanam di content.js (sekitar " + Math.round(nilai.length / 1024) + " KB)."
          : "Memakai file: " + nilai + " — pastikan file itu benar-benar ada di folder assets/.";
    } else {
      dropPreview.hidden = true;
      dropPreview.removeAttribute("src");
      dropZone.classList.remove("has-image");
      dropInner.hidden = false;
      dropActions.hidden = true;
    }
  }

  /* ---------- daftar karya ---------- */

  function renderList() {
    listTitle.textContent = "Daftar karya (" + entri.length + ")";

    if (!entri.length) {
      listEl.innerHTML =
        '<li class="entry-empty">Belum ada karya di daftar. Isi form di kiri, lalu klik <strong>Simpan ke daftar</strong>.</li>';
      return;
    }

    listEl.innerHTML = entri
      .map(function (e, i) {
        var meta = [e.genre, e.status, e.tahun]
          .filter(function (x) {
            return !!x;
          })
          .join(" · ");

        return (
          '<li class="entry' +
          (i === editing ? " is-editing" : "") +
          '">' +
          '<div class="entry-main">' +
          "<strong>" +
          esc(e.judul) +
          "</strong>" +
          (meta ? '<span class="entry-meta">' + esc(meta) + "</span>" : "") +
          (e.unggulan ? '<span class="entry-flag">Karya utama</span>' : "") +
          "</div>" +
          '<div class="entry-actions">' +
          '<button type="button" class="entry-btn" data-act="edit" data-index="' +
          i +
          '">Edit</button>' +
          '<button type="button" class="entry-btn is-danger" data-act="hapus" data-index="' +
          i +
          '">Hapus</button>' +
          "</div>" +
          "</li>"
        );
      })
      .join("");
  }

  function mulaiEdit(index) {
    var data = entri[index];
    if (!data) return;

    editing = index;
    isiForm(data);
    terapkanMode();
    renderList();
    simpanForm();
    setStatus('Mengedit "' + data.judul + '". Ubah kolomnya, lalu klik Simpan perubahan.');
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    f.judul.focus();
  }

  function hapusEntri(index) {
    var data = entri[index];
    if (!data) return;

    if (!window.confirm('Hapus "' + data.judul + '" dari daftar?')) return;

    entri.splice(index, 1);

    if (editing === index) {
      editing = -1;
      kosongkanForm();
    } else if (editing > index) {
      editing = editing - 1;
    }

    simpanDaftar();
    terapkanMode();
    renderList();
    sync();
    setStatus('"' + data.judul + '" dihapus dari daftar. Klik Salin semua kode untuk memperbarui content.js.', "ok");
  }

  /* ---------- kode untuk content.js ---------- */

  function blokEntri(e) {
    var baris = ["    {", '      judul: "' + quote(e.judul) + '",'];

    if (e.genre) baris.push('      genre: "' + quote(e.genre) + '",');
    baris.push('      status: "' + quote(e.status) + '",');
    if (e.tahun) baris.push('      tahun: "' + quote(e.tahun) + '",');
    if (e.deskripsi) baris.push('      deskripsi: "' + quote(e.deskripsi) + '",');

    baris.push('      gambar: "' + quote(e.gambar) + '",');
    if (e.trailer) baris.push('      trailer: "' + quote(e.trailer) + '",');
    if (e.unggulan) baris.push("      unggulan: true,");

    if (e.tautan && e.tautan.length) {
      baris.push("      tautan: [");
      e.tautan.forEach(function (t) {
        baris.push('        { teks: "' + quote(t.teks) + '", url: "' + quote(t.url) + '" },');
      });
      baris.push("      ],");
    }

    if (e.screenshots && e.screenshots.length) {
      baris.push("      screenshots: [");
      e.screenshots.forEach(function (s) {
        baris.push('        { judul: "' + quote(s.judul) + '", gambar: "' + quote(s.data) + '" },');
      });
      baris.push("      ],");
    }

    baris.push("    },");
    return baris.join("\n") + "\n";
  }

  function buildCode() {
    if (!entri.length) return "  game: [],";

    var blok = entri
      .map(function (e) {
        return blokEntri(e);
      })
      .join("");

    return "  game: [\n" + blok + "  ],";
  }

  function updateOutput() {
    var kode = buildCode();
    output.textContent = kode;
    copyBtn.disabled = false;
    return kode;
  }

  /* ---------- sinkron tampilan + simpan draft form ---------- */

  function simpanForm() {
    tulisStore(
      KEY_FORM,
      JSON.stringify({
        judul: f.judul.value,
        genre: f.genre.value,
        status: f.status.value,
        tahun: f.tahun.value,
        deskripsi: f.deskripsi.value,
        gambar: f.gambar.value,
        trailer: f.trailer.value,
        unggulan: f.unggulan.checked,
        tautan: readTautanMentah(),
        editing: editing,
      })
    );
  }

  function sync() {
    renderPreview();
    renderDrop();
    updateOutput();
    simpanForm();
  }

  /* ---------- salin kode ---------- */

  function pilihTeksKode() {
    var range = document.createRange();
    range.selectNodeContents(output);
    var sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function copyCode() {
    var kode = buildCode();
    var selesai = false;

    if (!kode) {
      setStatus("Belum ada karya di daftar, jadi belum ada yang bisa disalin.", "error");
      return;
    }

    setStatus("Menyalin kode…");

    function berhasil() {
      if (selesai) return;
      selesai = true;
      setStatus(
        "Kode daftar disalin. Di content.js, pilih mulai dari game: [ sampai ], penutupnya, lalu tempel menimpa pilihan itu.",
        "ok"
      );
      copyBtn.innerHTML = "<span>Tersalin ✓</span>";
      window.setTimeout(function () {
        copyBtn.innerHTML = "<span>Salin semua kode</span>";
      }, 2200);
    }

    function gagal() {
      if (selesai) return;
      selesai = true;
      setStatus(
        "Browser memblokir penyalinan otomatis. Kode di bawah sudah dipilih — tekan Ctrl+C.",
        "error"
      );
      pilihTeksKode();
    }

    function salinManual() {
      var area = document.createElement("textarea");
      area.value = kode;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "-1000px";
      document.body.appendChild(area);
      area.select();

      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (err) {
        ok = false;
      }
      document.body.removeChild(area);

      if (ok) berhasil();
      else gagal();
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        navigator.clipboard.writeText(kode).then(berhasil, function () {
          if (!selesai) salinManual();
        });
      } catch (err) {
        salinManual();
        return;
      }

      /* Kalau izin clipboard membuat janji itu menggantung, pakai cara lama
         supaya tombol tidak terasa "tidak bekerja". */
      window.setTimeout(function () {
        if (!selesai) salinManual();
      }, 600);

      return;
    }

    salinManual();
  }

  /* ---------- aksi form ---------- */

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var data = entriDariForm();
    if (!data.judul) {
      setStatus("Judul wajib diisi.", "error");
      f.judul.focus();
      return;
    }

    if (editing >= 0 && entri[editing]) {
      entri[editing] = data;
      editing = -1;
      terapkanMode();
      kosongkanForm();
      var tersimpanEdit = simpanDaftar();
      renderList();
      sync();
      setStatus(
        tersimpanEdit
          ? 'Perubahan "' + data.judul + '" tersimpan di daftar.'
          : 'Perubahan ada di halaman ini, tapi browser menolak menyimpan daftar (gambar terlalu besar). Segera salin kodenya ke content.js.',
        tersimpanEdit ? "ok" : "error"
      );
      return;
    }

    entri.push(data);
    kosongkanForm();
    var tersimpanBaru = simpanDaftar();
    renderList();
    sync();
    setStatus(
      tersimpanBaru
        ? '"' + data.judul + '" masuk ke daftar. Tambah karya lain, atau klik Salin semua kode.'
        : '"' + data.judul + '" masuk ke daftar, tapi browser menolak menyimpannya (gambar terlalu besar). Segera salin kodenya ke content.js.',
      tersimpanBaru ? "ok" : "error"
    );
    f.judul.focus();
  });

  form.addEventListener("input", sync);
  form.addEventListener("change", sync);

  document.getElementById("addTautan").addEventListener("click", function () {
    addRow("", "");
    sync();
    var terakhir = tautanList.querySelector(".repeat-row:last-child .tautan-teks");
    if (terakhir) terakhir.focus();
  });

  /* ---------- drop / pilih gambar ---------- */

  window.addEventListener("dragover", function (ev) {
    ev.preventDefault();
  });

  window.addEventListener("drop", function (ev) {
    ev.preventDefault();
  });

  dropZone.addEventListener("click", function () {
    f.gambarFile.click();
  });

  dropZone.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar") {
      ev.preventDefault();
      f.gambarFile.click();
    }
  });

  ["dragenter", "dragover"].forEach(function (nama) {
    dropZone.addEventListener(nama, function (ev) {
      ev.preventDefault();
      dropZone.classList.add("is-drag");
    });
  });

  ["dragleave", "dragend"].forEach(function (nama) {
    dropZone.addEventListener(nama, function () {
      dropZone.classList.remove("is-drag");
    });
  });

  dropZone.addEventListener("drop", function (ev) {
    ev.preventDefault();
    dropZone.classList.remove("is-drag");
    var file = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
    if (file) pakaiFile(file);
  });

  f.gambarFile.addEventListener("change", function () {
    var file = f.gambarFile.files && f.gambarFile.files[0];
    if (file) pakaiFile(file);
    f.gambarFile.value = "";
  });

  hapusGambarBtn.addEventListener("click", function () {
    f.gambar.value = "";
    sync();
    setStatus("Gambar dihapus dari karya ini.", "ok");
  });

  cancelEditBtn.addEventListener("click", function () {
    editing = -1;
    terapkanMode();
    kosongkanForm();
    renderList();
    sync();
    setStatus("Batal edit. Form siap untuk karya baru.");
  });

  copyBtn.addEventListener("click", copyCode);

  resetBtn.addEventListener("click", function () {
    editing = -1;
    terapkanMode();
    kosongkanForm();
    renderList();
    sync();
    setStatus("Form dikosongkan. Daftar karya tidak berubah.");
    f.judul.focus();
  });

  clearDraftBtn.addEventListener("click", function () {
    hapusStore(KEY_FORM);
    draftNote.hidden = true;
    setStatus("Draft isian di perangkat ini dihapus.");
  });

  listEl.addEventListener("click", function (ev) {
    var btn = ev.target.closest ? ev.target.closest("button[data-act]") : null;
    if (!btn) return;

    var index = Number(btn.getAttribute("data-index"));
    if (btn.getAttribute("data-act") === "edit") mulaiEdit(index);
    else hapusEntri(index);
  });

  syncBtn.addEventListener("click", function () {
    var dariFile = entriDariFile();

    if (entri.length || bacaStore(KEY_LIST)) {
      if (!window.confirm("Ambil ulang daftar dari content.js? Daftar yang tersimpan di browser ini akan diganti.")) {
        return;
      }
    }

    entri = dariFile;
    editing = -1;
    hapusStore(KEY_LIST);
    terapkanMode();
    renderList();
    updateOutput();
    listNote.textContent =
      "Daftar diambil dari content.js. Kalau file itu diubah manual, klik Muat dari content.js lagi.";
    setStatus(
      dariFile.length
        ? dariFile.length + " karya dimuat dari content.js."
        : "content.js sedang kosong — daftar dikosongkan.",
      "ok"
    );
  });

  /* ---------- mulai ---------- */

  (function mulai() {
    var tersimpan = bacaStore(KEY_LIST);
    var adaTersimpan = false;

    if (tersimpan) {
      try {
        var data = JSON.parse(tersimpan);
        if (Array.isArray(data)) {
          entri = data.map(rapikan).filter(function (e) {
            return e.judul;
          });
          adaTersimpan = true;
        }
      } catch (err) {
        entri = [];
      }
    }

    if (!adaTersimpan) entri = entriDariFile();

    listNote.textContent = adaTersimpan
      ? "Daftar ini tersimpan di browser ini. Klik Salin semua kode untuk memindahkannya ke content.js."
      : entri.length
      ? "Daftar diambil dari content.js. Kalau file itu diubah manual, klik Muat dari content.js."
      : "content.js belum berisi karya. Mulai dari form di kiri.";

    /* pulihkan isian form terakhir */
    var formTersimpan = bacaStore(KEY_FORM);
    if (formTersimpan) {
      try {
        var fd = JSON.parse(formTersimpan);
        var adaIsi = false;

        ["judul", "genre", "status", "tahun", "deskripsi", "gambar", "trailer"].forEach(function (key) {
          if (typeof fd[key] === "string") {
            f[key].value = fd[key];
            if (fd[key].trim()) adaIsi = true;
          }
        });

        f.unggulan.checked = !!fd.unggulan;
        if (fd.unggulan) adaIsi = true;

        if (Array.isArray(fd.tautan) && fd.tautan.length) {
          adaIsi = true;
          fd.tautan.slice(0, MAX_TAUTAN).forEach(function (t) {
            addRow(t && t.teks, t && t.url);
          });
        }

        if (Number(fd.editing) >= 0 && entri[Number(fd.editing)]) {
          editing = Number(fd.editing);
          adaIsi = true;
        }

        if (adaIsi) draftNote.hidden = false;
      } catch (err) {
        /* draft rusak — abaikan */
      }
    }

    if (!tautanList.children.length) addRow("", "");
    terapkanMode();
    renderList();
    sync();
  })();

})();
