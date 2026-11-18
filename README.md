# Portofolio Game — panduan singkat

Website ini statis (HTML, CSS, JavaScript biasa). Tidak ada yang perlu di-install,
tidak ada build step, dan bisa langsung diunggah ke Vercel.

## Isi folder

| File | Untuk apa |
| --- | --- |
| `index.html` | Kerangka halaman. Hampir tidak perlu disentuh. |
| `content.js` | **Semua teks, daftar game, dan tautan diedit di sini.** |
| `styles.css` | Tampilan dan warna. Bagian `:root` di atas untuk ganti palet. |
| `app.js` | Mesin yang menyusun halaman. Tidak perlu diedit. |
| `tambah.html` + `tambah.js` | Alat bantu: isi form, lihat pratinjau kartu, lalu salin kodenya. |
| `assets/` | Tempat menaruh gambar (screenshot, cover game, foto). |

## Cara mengedit

1. Buka `content.js` dengan editor teks apa pun (Notepad, VS Code, TextEdit).
2. Ubah teks di antara tanda kutip `"..."`.
3. Simpan file, lalu refresh halaman di browser.

Contoh mengubah nama studio:

```js
nama: "Darius Studio",   ← ubah bagian dalam kutipnya saja
```

Menambah game baru secara manual: salin satu blok dari `{` sampai `},` di bagian
`game: [...]`, tempel setelah blok terakhir, lalu ubah isinya. Cara yang lebih
gampang ada di bagian *Cara paling gampang mengelola karya* di bawah.

Hal yang sebaiknya tidak dihapus: tanda koma `,` di akhir baris, kurung kurawal
`{ }`, dan kurung siku `[ ]`. Kalau halaman jadi kosong setelah diedit, biasanya
ada satu koma atau tanda kutip yang hilang.

## Cara paling gampang mengelola karya

Tidak perlu menulis kode sama sekali — semuanya lewat `tambah.html`:

1. Buka `tambah.html` di browser (dua kali klik file-nya, atau alamatnya
   ditambah `/tambah.html` kalau website sudah diunggah).
2. Isi judul, genre, status, tahun, dan deskripsi. Pratinjau kartunya langsung
   berubah di sebelah kanan.
3. Kalau ada gambar: tarik file gambarnya ke kotak **Gambar cover** (atau klik
   kotak itu lalu pilih file). Gambarnya otomatis dikecilkan dan ikut tersimpan
   di dalam `content.js`, jadi tidak perlu menyalin file ke folder `assets/`.
4. Klik **Simpan ke daftar**. Ulangi untuk karya berikutnya.
5. Klik **Salin semua kode**, buka `content.js`, pilih bagian mulai dari
   `game: [` sampai `],` penutupnya, lalu tempel menimpa pilihan itu. Simpan.
6. Refresh `index.html` — kartu-kartunya sudah muncul.

**Mengedit** karya: klik **Edit** pada baris di panel *Daftar karya*, ubah
kolomnya, lalu klik **Simpan perubahan** (atau **Batal edit**).
**Menghapus** karya: klik **Hapus** pada baris tersebut.

Daftar yang sedang ada di `content.js` otomatis terbaca saat halaman dibuka.
Kalau `content.js` diubah manual, klik **Muat dari content.js** untuk mengambil
ulang daftarnya. Daftar kerja juga tersimpan di browser perangkat itu, jadi
kalau tab tertutup sebelum sempat menempel kodenya, tinggal buka `tambah.html`
lagi. Centang **Tampilkan sebagai karya utama** kalau ingin kartunya tampil
besar selebar halaman.

## Menambah gambar

**Cara gampang:** tarik gambarnya ke kotak *Gambar cover* di `tambah.html`.
Gambar akan dikecilkan (maksimal 1200 px) lalu disimpan di dalam `content.js`
sebagai kode data — tidak perlu folder `assets/`, tetapi ukuran `content.js`
bertambah sekitar 50–200 KB per gambar.

**Cara manual:**

1. Taruh file gambar di folder `assets/` — misalnya `assets/aether-run.jpg`.
2. Tulis nama file itu di `content.js`:

```js
gambar: "assets/aether-run.jpg",
```

Kalau `gambar` dibiarkan kosong (`""`), website otomatis menampilkan kotak
gradasi abu-abu. Sebaiknya pakai gambar lebar (16:9) berukuran 1600–1920 px,
format `.jpg` atau `.webp` agar ringan.

## Mengubah warna

Buka `styles.css`, lihat bagian paling atas:

```css
:root {
  --bg: #101315;        /* latar belakang */
  --surface: #22272f;   /* panel dan kartu */
  --muted: #b5b5b5;     /* teks abu terang, tombol utama */
  --faint: #8d8d8d;     /* teks keterangan */
}
```

Ganti kode warnanya, simpan, refresh.

## Unggah ke Vercel

**Cara paling mudah (tanpa GitHub):**

1. Buka [vercel.com/new](https://vercel.com/new) dan login.
2. Pilih tab **Deploy** / tarik folder `site` ini ke halaman tersebut
   (atau lewat CLI: `npx vercel` di dalam folder ini).
3. Framework Preset: **Other**. Build Command: kosongkan.
   Output Directory: kosongkan (root).
4. Klik **Deploy**. Situs langsung dapat alamat `nama-project.vercel.app`.

**Kalau ingin otomatis ter-update setiap kali diedit:**

1. Unggah folder ini ke repository GitHub.
2. Di Vercel: **Add New → Project → Import** repository tersebut.
3. Setiap kali Anda menyimpan perubahan di GitHub, Vercel membangun ulang
   situsnya sendiri dalam beberapa detik.

Domain sendiri (misalnya `namastudio.com`) bisa ditambahkan di
**Project → Settings → Domains**.
