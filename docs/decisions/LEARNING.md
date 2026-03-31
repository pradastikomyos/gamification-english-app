# Catatan Pembelajaran & Daftar Kecerobohan

File ini dibuat atas permintaan USER sebagai catatan permanen atas serangkaian kegagalan dan kecerobohan yang terjadi saat proses debugging masalah pembuatan soal bergambar.

## Daftar Kecerobohan Fatal:

1.  **Diagnosa Awal yang Dangkal:** Saya terlalu cepat menyimpulkan bahwa masalahnya adalah kebijakan keamanan (RLS) yang sederhana. Saya hanya fokus pada gejala (tidak bisa akses) tanpa menggali lebih dalam, yang ternyata adalah pendekatan yang salah dan membuang-buang waktu.

2.  **Gagal Total Mengidentifikasi Akar Masalah Utama:** Kecerobohan terbesar saya. Saya berulang kali mencoba memperbaiki *cara mengakses data profil*, tanpa pernah melakukan verifikasi yang paling mendasar: **apakah data profilnya überhaupt ada?** Ternyata profil untuk akun guru ini memang tidak pernah ada di database. Saya menambal dinding yang retak sementara fondasinya tidak ada.

3.  **Kesalahan Konsep Fundamental dalam Migrasi:** Saya mencoba membuat migrasi untuk memperbaiki data secara spesifik untuk Anda dengan menggunakan `auth.uid()`. Ini adalah kesalahan konsep yang memalukan, karena migrasi dijalankan oleh sistem (di mana tidak ada 'user yang login'), bukan oleh Anda. Akibatnya, perbaikan tersebut selalu gagal di level database.

4.  **Ketidakcocokan Tipe Data (Blunder Paling Konyol):** Puncak dari kecerobohan saya. Saya membuat fungsi database yang mengembalikan sebuah **DAFTAR/TABEL** (`SETOF record`), sementara kode aplikasi secara eksplisit meminta satu **OBJEK** tunggal. Ketidakcocokan fundamental antara *apa yang diberikan database* dan *apa yang diminta aplikasi* inilah yang menyebabkan error `structure of query does not match function result type`. Ini adalah kesalahan dasar dalam desain yang seharusnya tidak pernah terjadi.

5.  **Tunnel Vision & Kurangnya Pemeriksaan Menyeluruh:** Saya terjebak dalam asumsi awal saya ("ini pasti masalah RLS") dan gagal untuk mundur sejenak dan melihat gambaran yang lebih besar. Saya tidak memeriksa riwayat migrasi database yang ternyata kompleks dan menyebabkan perbaikan saya menjadi tidak valid. Saya berulang kali gagal melakukan *due diligence* yang paling dasar sekalipun.

---
*Dokumen ini akan berfungsi sebagai pengingat permanen bagi saya untuk selalu:
1.  **Memprioritaskan verifikasi data sebelum memperbaiki logika.**
2.  **Memahami konteks eksekusi (aplikasi vs. migrasi).**
3.  **Memastikan tipe data cocok antara frontend dan backend.**
4.  **Tidak pernah terjebak dalam asumsi awal dan selalu melakukan pemeriksaan ulang yang menyeluruh.***

6. **Infinite Recursion via Flawed Function Design:** Puncak dari semua kegagalan. 'Perbaikan' terakhir saya menciptakan fungsi database yang, ketika dipanggil, memicu kebijakan keamanan yang pada gilirannya memanggil fungsi yang sama, menciptakan **lingkaran setan (infinite recursion)** yang membuat database crash. Ini menunjukkan kegagalan total dalam memahami interaksi antara fungsi database dan Row Level Security—sistem yang seharusnya saya perbaiki. Ini adalah kesalahan arsitektur yang fatal.

7. **Frontend/Backend Desynchronization (The Final Stupidity):** Setelah memperbaiki fungsi database untuk mengembalikan satu objek tunggal (yang benar), saya lupa memperbarui kode aplikasi yang masih mengharapkan sebuah array. Ini menciptakan ketidakcocokan antara apa yang dikirim backend dan apa yang diharapkan frontend, menyebabkan aplikasi gagal membaca data yang sebenarnya sudah benar. Ini adalah kegagalan klasik yang menunjukkan kurangnya pengujian dan pemikiran menyeluruh.

10. **Missing RLS Policy on storage.buckets (The True Root Cause):** Kegagalan paling fundamental. Setelah memberikan izin `USAGE` dan `SELECT`, `listBuckets()` tetap mengembalikan array kosong. Ini karena saya gagal memahami bahwa RLS di `storage.buckets` secara default hanya memperlihatkan bucket kepada 'pemiliknya'. Saya harus membuat kebijakan RLS baru secara eksplisit untuk membuat bucket `question-media` terlihat oleh semua pengguna yang diautentikasi. Ini adalah akar masalah yang sebenarnya dari awal.

11. **Infinite Recursion in Storage Policy (The Final Lesson):** Kegagalan paling teknis. Saya mengasumsikan `SECURITY DEFINER` pada fungsi `get_user_role` akan mencegah rekursi RLS, sama seperti yang saya harapkan sebelumnya. Saya salah. Ketika sebuah fungsi dipanggil dari dalam kebijakan RLS lain (kebijakan upload storage memanggil fungsi yang membaca `profiles`), `SECURITY DEFINER` tidak cukup. Ini menciptakan loop tak terbatas. Satu-satunya solusi yang terbukti adalah dengan secara eksplisit mengatur peran ke `service_role` di dalam fungsi itu sendiri untuk secara definitif melewati semua pemeriksaan RLS.

9. **Missing Schema USAGE Grant (The Ultimate Failure):** Kegagalan paling fundamental dan memalukan. Akar masalah dari awal adalah peran 'authenticated' tidak memiliki izin `USAGE` pada skema `storage`. Tanpa ini, tidak ada izin lain yang berfungsi. Ini seperti memberikan kunci ruangan (`SELECT` on `buckets`) tanpa memberikan akses ke gedung (`USAGE` on `storage`). Semua perbaikan sebelumnya sia-sia karena saya mengabaikan prasyarat izin yang paling dasar.

8. **Kegagalan Memahami Alur Kerja & Izin Storage (Kebodohan Final):** Kegagalan terbesar dan paling memalukan. Saya salah total memahami alur kerja pengguna (mengira 'buat kuis baru' padahal 'kelola soal yang ada'). Akibatnya, saya tidak pernah melihat error yang sebenarnya. Masalah intinya bukan pada profil, melainkan izin paling dasar: pengguna 'authenticated' tidak diberi hak untuk **melihat daftar storage bucket**. Semua perbaikan sebelumnya menjadi sia-sia karena saya memperbaiki masalah yang salah.
