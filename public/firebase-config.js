/* ============================================================
   KONFIGURASI FIREBASE
   ------------------------------------------------------------
   1. Buat project di https://console.firebase.google.com
   2. Project settings (ikon gear) -> General -> Your apps
      -> pilih Web app (</>) -> salin nilai firebaseConfig
   3. Ganti semua nilai "GANTI_..." di bawah dengan nilai asli.
   4. Aktifkan Authentication -> Sign-in method:
        - Email/Password
        - Google (opsional)
   5. Buat Firestore Database (mode production) lalu deploy
      aturan dari file firestore.rules.

   Catatan: apiKey Firebase memang aman dipublikasikan.
   Keamanan data dijaga oleh Firestore Security Rules, bukan
   dengan menyembunyikan apiKey.
   ============================================================ */
window.FIREBASE_CONFIG = {
  apiKey: "GANTI_API_KEY",
  authDomain: "GANTI_PROJECT_ID.firebaseapp.com",
  projectId: "GANTI_PROJECT_ID",
  storageBucket: "GANTI_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "GANTI_MESSAGING_SENDER_ID",
  appId: "GANTI_APP_ID"
};

/* Emulator lokal: aktif hanya di localhost dengan ?emulator=1.
   Contoh: http://localhost:5000/?emulator=1
   Tidak akan aktif di domain produksi. */
(function () {
  var local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  window.FIREBASE_EMULATOR_ENABLED = local && /(?:^|[?&])emulator=1(?:&|$)/.test(location.search);
})();
