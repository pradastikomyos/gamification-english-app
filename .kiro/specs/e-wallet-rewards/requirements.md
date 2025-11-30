# Requirements Document

## Introduction

Fitur E-wallet Rewards adalah sistem penghargaan digital yang memberikan saldo e-wallet (seperti DANA) kepada siswa SMK berdasarkan pencapaian akademik mereka dalam platform pembelajaran bahasa Inggris. Sistem ini bertujuan untuk meningkatkan motivasi belajar siswa dengan memberikan reward nyata yang dapat digunakan dalam kehidupan sehari-hari.

## Requirements

### Requirement 1

**User Story:** Sebagai siswa SMK, saya ingin mendapatkan saldo e-wallet sebagai reward atas pencapaian akademik saya, sehingga saya lebih termotivasi untuk belajar dan menyelesaikan quiz dengan baik.

#### Acceptance Criteria

1. WHEN siswa mencapai peringkat 1 di leaderboard kelas THEN sistem SHALL memberikan reward saldo e-wallet sebesar Rp 100.000
2. WHEN siswa mencapai peringkat 2 di leaderboard kelas THEN sistem SHALL memberikan reward saldo e-wallet sebesar Rp 50.000
3. WHEN siswa mencapai peringkat 3 di leaderboard kelas THEN sistem SHALL memberikan reward saldo e-wallet sebesar Rp 25.000
3. WHEN siswa mencapai milestone tertentu (contoh: 1000 poin total) THEN sistem SHALL memberikan reward saldo e-wallet sesuai tier yang ditentukan
4. WHEN periode evaluasi berakhir (bulanan/semester) THEN sistem SHALL secara otomatis menghitung dan mendistribusikan reward kepada siswa yang memenuhi kriteria

### Requirement 2

**User Story:** Sebagai siswa, saya ingin dapat melihat riwayat reward yang telah saya terima dan status pencairan saldo e-wallet, sehingga saya dapat melacak pencapaian dan reward yang telah diperoleh.

#### Acceptance Criteria

1. WHEN siswa mengakses halaman rewards THEN sistem SHALL menampilkan total saldo reward yang tersedia
2. WHEN siswa mengakses riwayat rewards THEN sistem SHALL menampilkan daftar semua reward yang pernah diterima dengan tanggal dan jumlah
3. WHEN siswa melihat detail reward THEN sistem SHALL menampilkan status pencairan (pending, processed, completed)
4. WHEN siswa memiliki saldo reward THEN sistem SHALL menampilkan opsi untuk mencairkan ke e-wallet pilihan (DANA, OVO, GoPay)

### Requirement 3

**User Story:** Sebagai siswa, saya ingin dapat mencairkan saldo reward ke e-wallet saya, sehingga saya dapat menggunakan reward tersebut untuk keperluan sehari-hari.

#### Acceptance Criteria

1. WHEN siswa memiliki saldo reward minimal Rp 10.000 THEN sistem SHALL mengaktifkan fitur pencairan
2. WHEN siswa memilih mencairkan saldo THEN sistem SHALL meminta konfirmasi nomor e-wallet dan jenis e-wallet (DANA/OVO/GoPay)
3. WHEN siswa mengkonfirmasi pencairan THEN sistem SHALL memproses request dan mengubah status menjadi "processing"
4. WHEN pencairan berhasil diproses THEN sistem SHALL mengirim notifikasi kepada siswa dan mengupdate status menjadi "completed"
5. IF pencairan gagal THEN sistem SHALL mengembalikan saldo dan memberikan notifikasi error kepada siswa

### Requirement 4

**User Story:** Sebagai admin/guru, saya ingin dapat mengelola sistem reward dan memonitor distribusi saldo e-wallet, sehingga saya dapat memastikan sistem berjalan dengan baik dan fair.

#### Acceptance Criteria

1. WHEN admin mengakses dashboard rewards THEN sistem SHALL menampilkan statistik total reward yang telah didistribusikan
2. WHEN admin melihat daftar penerima reward THEN sistem SHALL menampilkan siswa yang berhak menerima reward berdasarkan kriteria yang ditetapkan
3. WHEN admin perlu mengatur kriteria reward THEN sistem SHALL menyediakan interface untuk mengubah threshold poin dan jumlah reward
4. WHEN admin perlu memverifikasi pencairan THEN sistem SHALL menyediakan fitur approval untuk request pencairan yang memerlukan verifikasi manual

### Requirement 5

**User Story:** Sebagai sistem, saya ingin dapat terintegrasi dengan API e-wallet provider untuk memproses pencairan otomatis, sehingga siswa dapat menerima reward dengan cepat dan efisien.

#### Acceptance Criteria

1. WHEN sistem memproses pencairan THEN sistem SHALL menggunakan API e-wallet provider untuk transfer saldo
2. WHEN API call berhasil THEN sistem SHALL menyimpan transaction ID dan mengupdate status pencairan
3. WHEN API call gagal THEN sistem SHALL retry maksimal 3 kali dengan exponential backoff
4. IF semua retry gagal THEN sistem SHALL menandai pencairan untuk manual review dan mengirim notifikasi ke admin
5. WHEN sistem melakukan API call THEN sistem SHALL mencatat semua request dan response untuk audit trail

### Requirement 6

**User Story:** Sebagai siswa, saya ingin mendapatkan notifikasi ketika saya menerima reward atau ketika status pencairan berubah, sehingga saya selalu update dengan perkembangan reward saya.

#### Acceptance Criteria

1. WHEN siswa menerima reward baru THEN sistem SHALL mengirim notifikasi in-app dan email
2. WHEN status pencairan berubah THEN sistem SHALL mengirim notifikasi real-time kepada siswa
3. WHEN pencairan berhasil THEN sistem SHALL mengirim konfirmasi dengan detail transaksi
4. WHEN mendekati deadline periode evaluasi THEN sistem SHALL mengirim reminder kepada siswa tentang kesempatan mendapatkan reward