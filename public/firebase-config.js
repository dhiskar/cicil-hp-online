/* ============================================================
   KONFIGURASI FIREBASE
   ------------------------------------------------------------
   File ini dibaca oleh index.html sebagai window.FIREBASE_CONFIG.
   Jangan mengubah nama variabelnya menjadi "const firebaseConfig".
   ============================================================ */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyC08ZqnzqcALGE09TqEr_eLIaL04aNjpkg",
  authDomain: "cicil-hp.firebaseapp.com",
  projectId: "cicil-hp",
  storageBucket: "cicil-hp.firebasestorage.app",
  messagingSenderId: "290936440637",
  appId: "1:290936440637:web:e798bd94fd2de857f02754",
  measurementId: "G-GSZBXYK1B2"
};

/* Emulator lokal: aktif hanya di localhost dengan ?emulator=1.
   Contoh: http://localhost:5000/?emulator=1
   Tidak akan aktif di domain produksi. */
(function () {
  var local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  window.FIREBASE_EMULATOR_ENABLED = local && /(?:^|[?&])emulator=1(?:&|$)/.test(location.search);
})();
