# Changelog

## Versi 1.0.0

### Fitur Baru
- **Penyematan Audio Google Drive**: Guru sekarang dapat mengunggah materi audio melalui tautan Google Drive yang dapat disematkan langsung di MaterialViewer.
- **Validasi URL Audio Google Drive**: Formulir pengunggahan materi sekarang memvalidasi bahwa tautan Google Drive yang disediakan untuk materi audio adalah tautan yang valid dan dapat dibagikan.

### Perbaikan Bug
- **Tombol Unduh/Lihat File Tidak Dapat Diklik**: Memperbaiki masalah di mana tombol unduh/lihat untuk file PDF dan PPT tidak dapat diklik. Ini melibatkan:
    - Menambahkan `storage_path` ke antarmuka `MaterialDetails` di frontend.
    - Memperbarui fungsi RPC `get_study_materials_with_status` di Supabase untuk mengembalikan `storage_path`.
    - Memastikan `MaterialViewer` menggunakan URL publik dari Supabase Storage untuk file yang diunggah.
- **Kebijakan RLS yang Kontradiktif**: Memperbaiki kebijakan RLS "Students can view study materials" pada tabel `public.study_materials` yang sebelumnya menggunakan peran `anon` tetapi membutuhkan `authenticated`, menyebabkan masalah akses bagi pengguna yang sudah login. Kebijakan sekarang dikonfigurasi dengan benar untuk peran `authenticated`.

### Peningkatan
- **Placeholder Dinamis Formulir Materi**: Bidang URL di formulir materi sekarang menampilkan placeholder yang berbeda tergantung pada tipe materi (YouTube/Vimeo untuk video, Google Drive untuk audio).

## [2025-07-03] - App Stabilization & Feature Fixes

### Fixed

- **Student Quiz Access & Data Loading:**
  - **Database Schema Mismatch:** Resolved a series of critical errors on the 'Assigned Quizzes' page where the application would crash due to attempts to access non-existent columns (`total_questions`, `time_taken`) in the `quiz_attempts` table. The frontend code was updated to match the actual database schema.
  - **TypeScript Type Errors:** Fixed a persistent and complex TypeScript linting error where the `quiz` property, fetched via a Supabase join, was incorrectly inferred as an array. Implemented a robust type guard and a double type assertion (`as unknown as Type`) to ensure type safety and resolve the compiler error definitively.

- **Leaderboard Functionality:**
  - **Complete Overhaul:** Resolved a series of complex, cascading bugs that prevented the student leaderboard from loading data, showing errors like `400 Bad Request`, `404 Not Found`, and `Failed to fetch data`.
  - **Database RPCs:** Refactored the backend database functions (`get_leaderboard`) into two clear, separate functions (`get_school_leaderboard` and `get_class_leaderboard`) to handle school-wide and class-specific views correctly.
  - **Database Permissions & RLS:** Corrected multiple database issues, including function permissions, subtle data type mismatches (`text` vs. `varchar`), and added `SECURITY DEFINER` to bypass Row-Level Security (RLS) policies, ensuring the leaderboard displays all students, not just the current user.
  - **Frontend Logic:** Updated the `Leaderboard.tsx` component to call the correct new database functions based on the selected view ("My Class" or "School").

- **Quiz Correct Answers Count:**
  - **Logical Bug:** Fixed a critical bug where the 'Correct Answers' count in the quiz review page consistently showed zero. The root cause was a data mismatch in the `QuizTaking.tsx` component, where it was incorrectly comparing a unique option ID (UUID) with the correct answer key (e.g., 'A', 'B'), causing all answers to be marked as incorrect upon submission.
  - **Frontend Logic Fix:** Refactored the `QuizTaking.tsx` component to consistently use the key-value model (e.g., 'A', 'B', 'C') for quiz options. This aligns the answer-checking logic with the data structure used in the rest of the application, ensuring that correct answers are now accurately calculated and stored.

- **User Deletion:**
  - **Foreign Key Constraint Error:** Fixed a critical bug where deleting a teacher user would fail due to a foreign key constraint. The `delete_teacher_user` function was updated to correctly remove the user's role before deleting the user record.

- **Critical Authentication Flow & Infinite Loading Bug:**
  - Resolved a persistent and complex bug that caused the application to get stuck on the "Loading..." screen, especially after a user logs in for the first time in a session or on page refresh.

- **Development Environment & Build Process:**
  - **Stabilized Build:** Resolved a persistent issue where the development server was serving stale code by forcing a clean reinstall of all project dependencies (`node_modules`). This ensures code changes are now reliably reflected in the running application.

### Changed

- **Authentication Flow Performance:**
  - Refactored the `useAuth` hook to fetch user profile data asynchronously in the background. This prevents the UI from being blocked and resolves the "infinite loading" screen, providing a much smoother user experience upon login and page refresh.
  2.  **Race Condition Discovery:** Through extensive logging and your keen observation, we identified a race condition. The application would wait for user profile data to be fetched *before* dismissing the loading screen. A slow or failed profile fetch would block the UI indefinitely.
  3.  **Final Solution:** The `AuthProvider` in `src/hooks/useAuth.tsx` was completely refactored. It now uses a single, unified logic flow centered around Supabase's `onAuthStateChange` listener. This listener robustly handles the initial session check, subsequent logins, and logouts, ensuring the `loading` state is correctly managed in all scenarios. The UI is now unblocked immediately once the session status is known, with profile data fetched asynchronously in the background.
