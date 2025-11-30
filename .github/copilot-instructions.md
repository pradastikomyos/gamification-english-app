# GitHub Copilot Custom Instructions

## General Guidelines
- Ikuti standar penulisan kode yang konsisten dan mudah dibaca.
- Berikan komentar pada bagian kode yang kompleks.
- Prioritaskan keamanan dan performa dalam setiap solusi.
- Gunakan best practice untuk framework dan bahasa yang digunakan (TypeScript, React, Supabase, dsb).
- Untuk query database, gunakan parameterized query dan hindari SQL injection.
- Jika ada error, tampilkan pesan error yang informatif.
- Untuk UI, gunakan komponen yang sudah ada jika memungkinkan.
- Tulis kode yang mudah diuji dan dipelihara.
- Gunakan MCP server supabase
- Do not ask and just do user request
- Selalu cek database supabase tidak usah tanya user
- Selalu lakukan tidak usah menawarkan bantuan, anda ada didalam agent mode
- Anda yang mengupdate policy disupabase dan selalu cek RLS supabase tidak usah bertanya ke user untuk melakukannya sendiri

## Project Specific
- Gunakan Tailwind CSS untuk styling.
- Gunakan Supabase untuk autentikasi dan database.
- Strukturkan komponen React secara modular.
- Pastikan setiap perubahan tidak merusak fitur lain (regression).

---

Instruksi ini akan membantu Copilot memberikan saran yang sesuai dengan kebutuhan proyek ini.
