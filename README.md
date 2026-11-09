# Cicilan HP Online

Versi online dari [dhiskar/cicil-hp](https://github.com/dhiskar/cicil-hp). Aplikasi pengelolaan cicilan handphone (pelanggan → kontrak → cicilan, kuitansi PDF/JPG, pengingat WhatsApp, laporan) yang sekarang **tersimpan di cloud**, punya **login**, dan **data setiap akun terpisah**.

## Apa yang berubah dari versi asli?

| Versi asli | Versi online ini |
|---|---|
| Data hanya di `localStorage` perangkat | Data disimpan di **Cloud Firestore** dan disinkronkan ke semua perangkat |
| Tanpa login | **Login email/password + Google** (Firebase Authentication) |
| Satu pengguna per browser | **Setiap akun punya data sendiri** (`users/{uid}/data/...`) |
| Tidak ada keamanan data terpusat | **Firestore Security Rules**: pengguna hanya bisa mengakses folder miliknya |
| File tunggal `CicilanHP.html` | Aplikasi statis di `public/`, siap deploy ke Firebase Hosting |

Fitur aplikasi tetap sama: pelanggan, kontrak, pembayaran, kuitansi JPG/PDF, WhatsApp, laporan, ekspor CSV, cadangan JSON, tema terang/gelap, dan PWA offline.

## Arsitektur

```
Browser (PWA)
  ├─ public/index.html      aplikasi + UI login + logika cicilan
  ├─ public/firebase-config.js  konfigurasi project Firebase Anda
  └─ Firebase SDK (CDN gstatic)
        ├─ Firebase Authentication   → login email/password & Google
        └─ Cloud Firestore           → database per akun

Firestore
  users/{uid}/data/pelanggan   { items: [...], seq }
  users/{uid}/data/kontrak     { items: [...], seq }
  users/{uid}/data/cicilan     { items: [...], seq }
  users/{uid}/data/meta        { toko, dibuat, updatedAt }
```

**Isolasi data** terjadi di dua lapis:

1. Aplikasi selalu membaca/menulis ke path `users/{uid}/...` berdasarkan UID pengguna yang login.
2. Firestore Security Rules menolak semua akses jika `request.auth.uid != userId`, jadi orang lain tidak bisa membaca data Anda meskipun tahu UID-nya.

Cache lokal (localStorage, IndexedDB, dan file cadangan) juga dipisahkan per UID.

## Prasyarat

- Akun Google.
- Node.js (untuk Firebase CLI) atau cukup `npx firebase-tools`.
- Java 11+ hanya jika ingin menjalankan emulator lokal.

## 0. Lokasi menu Firebase Console (2026)

Tampilan Firebase Console terbaru mengelompokkan menu berbeda dari tutorial lama. Gunakan daftar ini (ganti `PROJECT_ID` dengan Project ID Anda):

| Kebutuhan | Menu di console | Link langsung |
|---|---|---|
| Daftarkan Web App | **Project Overview** → ikon **Web** `</>` / **Add app** | `https://console.firebase.google.com/project/PROJECT_ID/overview` |
| Authentication | **Security → Authentication** | `https://console.firebase.google.com/project/PROJECT_ID/authentication` |
| Metode login | **Authentication → Sign-in method** | `https://console.firebase.google.com/project/PROJECT_ID/authentication/providers` |
| Firestore | **Databases & Storage → Firestore** | `https://console.firebase.google.com/project/PROJECT_ID/firestore` |
| Aturan Firestore | **Firestore → Rules** | `https://console.firebase.google.com/project/PROJECT_ID/firestore/rules` |
| Hosting | **Build → Hosting** | `https://console.firebase.google.com/project/PROJECT_ID/hosting` |
| Project settings | Ikon gear ⚙️ di kanan atas | `https://console.firebase.google.com/project/PROJECT_ID/settings/general` |

> Pada console versi lama, Authentication ada di **Build → Authentication**, sedangkan Firestore di **Build → Firestore Database**. Kalau menu tidak cocok, buka link langsung di tabel di atas.

## 1. Buat project Firebase

1. Buka <https://console.firebase.google.com> → **Add project**.
2. Setelah project dibuat, Anda akan berada di **Project Overview**.
3. Klik ikon **Web** (`</>`) di tengah halaman, atau tombol **Add app** lalu pilih **Web**. (Bisa juga lewat **Project settings ⚙️ → General → Your apps**.)
4. Beri nama aplikasi, klik **Register app**.
5. Salin objek `firebaseConfig` yang muncul.

## 2. Isi konfigurasi

Edit `public/firebase-config.js` dan ganti semua nilai `GANTI_...`:

```js
window.FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "project-anda.firebaseapp.com",
  projectId: "project-anda",
  storageBucket: "project-anda.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};
```

`apiKey` Firebase memang boleh publik. Keamanan data dijaga oleh Security Rules, bukan dengan menyembunyikan apiKey.

## 3. Aktifkan Authentication

Di Firebase Console:

1. Buka **Security → Authentication** (console lama: **Build → Authentication**), lalu klik **Get started**.
2. Tab **Sign-in method**:
   - Aktifkan **Email/Password**.
   - Aktifkan **Google** (pilih email support), jika ingin tombol Google.
3. Tab **Settings → Authorized domains**: pastikan domain hosting Anda ada. `localhost` sudah otomatis ada. Untuk Firebase Hosting, domain `*.web.app` / `*.firebaseapp.com` biasanya otomatis.

## 4. Buat Firestore

1. **Databases & Storage → Firestore** (console lama: **Build → Firestore Database**), lalu klik **Create database**.
2. Pilih **Production mode** (jangan test mode).
3. Pilih lokasi terdekat, misalnya `asia-southeast2` (Jakarta).
4. Deploy aturan keamanan dari repo ini:

```bash
firebase deploy --only firestore:rules
```

Aturan ada di `firestore.rules` dan isinya:

```
match /users/{userId}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
match /{document=**} { allow read, write: if false; }
```

## 5. Jalankan lokal

Cara tercepat memakai emulator Firebase (tidak menyentuh data produksi):

```bash
npx firebase-tools emulators:start --project demo-cicil-hp
```

Lalu buka:

```
http://localhost:5000/?emulator=1
```

`?emulator=1` hanya aktif di `localhost`/`127.0.0.1` dan hanya saat emulator berjalan.

Alternatif tanpa emulator: host folder `public/` dengan server statis apa pun, lalu buka di browser. Login akan memakai project Firebase asli dari `firebase-config.js`.

> Catatan: login Google tidak bisa diuji di emulator. Gunakan email/password untuk pengujian lokal.

## 6. Deploy ke Firebase Hosting

```bash
firebase login
firebase use --add          # pilih project Firebase Anda
firebase deploy --only hosting,firestore:rules
```

Setelah selesai, buka URL `https://<project>.web.app`.

## 7. Migrasi data dari versi lama (offline)

Data lama di `localStorage` tidak otomatis diunggah (agar tidak tercampur antar akun). Caranya:

1. Buka versi lama → **Pengaturan → Unduh cadangan manual**. Simpan file JSON.
2. Buka versi online ini → login → **Pengaturan → Pulihkan dari cadangan**.
3. Pilih file JSON tadi. Data akan diunggah ke akun yang sedang login.

## Keamanan & batasan

- **Setiap akun terpisah**: dibuktikan oleh path `users/{uid}` + Security Rules. Akun B tidak bisa membaca data akun A.
- **Password** ditangani Firebase Authentication (tidak pernah disimpan di aplikasi/database Anda).
- **Email verifikasi** dikirim otomatis saat daftar. Login tetap bisa dipakai sebelum verifikasi; status verifikasi tampil di Pengaturan.
- **Multi-perangkat**: perubahan terakhir yang menang (last write wins). Hindari mengedit data yang sama bersamaan di dua perangkat.
- **Ukuran data**: Firestore membatasi 1 MiB per dokumen. Karena data dipecah per koleksi (`pelanggan`, `kontrak`, `cicilan`), batas ini praktis sangat besar untuk aplikasi cicilan rumahan. Ribuan transaksi masih aman.
- **Kuota gratis Firebase Spark (2026)**: Auth 50.000 MAU; Firestore 1 GiB, 50.000 read/hari, 20.000 write/hari; Hosting gratis. Cukup untuk penggunaan pribadi/toko kecil.
- **Offline**: aplikasi tetap bisa dibuka dan menampilkan data terakhir yang tersimpan di perangkat. Perubahan akan dikirim saat online kembali.

## Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| Layar "Firebase belum dikonfigurasi" | `public/firebase-config.js` masih berisi `GANTI_...`. Isi config asli lalu muat ulang. |
| `auth/unauthorized-domain` | Tambahkan domain Anda di **Authentication → Settings → Authorized domains**. |
| `auth/operation-not-allowed` | Aktifkan **Email/Password** (dan **Google**) di **Authentication → Sign-in method**. |
| `permission-denied` | Firestore Rules belum dideploy. Jalankan `firebase deploy --only firestore:rules`. |
| Login Google tidak muncul / diblokir | Izinkan popup, atau browser akan dialihkan (redirect). Pastikan domain terdaftar. |
| Data tidak muncul di perangkat lain | Pastikan login dengan akun yang sama dan online. Cek status sinkron di **Pengaturan → Akun**. |
| Data lama hilang setelah update | Data lama ada di `localStorage` versi offline. Gunakan cadangan JSON seperti bagian migrasi. |
| Service worker menyajikan versi lama | Tutup semua tab aplikasi, buka lagi. Cache SW memakai network-first untuk halaman, jadi versi baru akan terambil saat online. |

## Struktur file

```
cicil-hp-online/
├─ public/
│  ├─ index.html              # aplikasi + login
│  ├─ firebase-config.js      # isi config Firebase di sini
│  ├─ manifest.webmanifest
│  ├─ sw.js
│  └─ icon-*.png
├─ firebase.json              # hosting, Firestore, emulator
├─ firestore.rules            # aturan isolasi data per akun
├─ firestore.indexes.json
├─ .gitignore
└─ README.md
```

## Perintah berguna

```bash
# emulator lokal (auth + firestore + hosting)
npx firebase-tools emulators:start --project demo-cicil-hp

# deploy hosting + rules
npx firebase-tools deploy --only hosting,firestore:rules

# hanya rules
npx firebase-tools deploy --only firestore:rules
```

## Lisensi & kredit

Aplikasi asli oleh [dhiskar](https://github.com/dhiskar/cicil-hp). Versi online ini menambahkan Firebase Authentication, Firestore, dan sinkronisasi per akun.
