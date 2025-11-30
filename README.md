# 🎯 Loveable English Spark

**Gamifikasi Pembelajaran Bahasa Inggris untuk SMK**

Platform pembelajaran interaktif yang dirancang khusus untuk meningkatkan kemampuan bahasa Inggris siswa SMK melalui sistem gamifikasi yang menarik dan komprehensif.

---

## 🚀 **Fitur Utama**

### 👨‍🏫 **Portal Guru (Teacher Portal)**
- **📝 Quiz Management**: CRUD quiz dengan template visual menarik
- **❓ Question Manager**: Manajemen soal per quiz dengan berbagai tingkat kesulitan
- **👥 Students Management**: Manajemen siswa dengan sistem autentikasi terintegrasi
- **📤 Quiz Assignment**: Assign quiz ke kelas dengan due date tracking
- **📊 Dashboard & Reports**: Overview aktivitas dan performa siswa
- **⚙️ Settings**: Konfigurasi akun dan notifikasi

### 👨‍🎓 **Portal Siswa (Student Portal)**
- **🏠 Dashboard**: Overview personal dengan level, poin, dan streak
- **📋 Assigned Quizzes**: Melihat quiz yang diberikan guru dengan status real-time
- **🎮 Interactive Quiz Taking**: Interface quiz interaktif dengan timer
- **📈 Quiz Results & Analytics**: Analisis performa dengan achievement system
- **🏆 Leaderboard**: Ranking siswa berdasarkan poin dan level
- **📚 Study Materials**: Library materi pembelajaran dengan progress tracking
- **🎖️ Achievement System**: 8+ badges dengan level progression

---

## 🎮 **Sistem Gamifikasi**

### 🏅 **Point & Level System**
- **Points**: Diperoleh dari menyelesaikan quiz
- **Levels**: Setiap 100 poin = level baru
- **Streak**: Tracking engagement harian

### 🏆 **Achievement Badges**
- 🌟 **First Steps**: Quiz pertama
- 🎯 **Quiz Master**: Menyelesaikan 10+ quiz
- ⭐ **Perfect Score**: Nilai 100%
- 🔥 **Streak Hero**: 7 hari berturut-turut
- Dan masih banyak lagi...

### 📊 **Leaderboard Competition**
- Ranking kelas dan sekolah
- Visual ranking dengan crown dan medals
- Progress tracking untuk motivasi

---

## 🛠️ **Tech Stack**

### **Frontend**
- **React 18** dengan TypeScript
- **Vite** untuk build tool
- **Tailwind CSS** untuk styling
- **Shadcn/UI** untuk komponen
- **Lucide React** untuk icons

### **Backend & Database**
- **Supabase** (PostgreSQL + Auth + Edge Functions)
- **Row Level Security (RLS)** untuk keamanan data
- **Real-time subscriptions** untuk update live

### **Development Tools**
- **ESLint** untuk code quality
- **PostCSS** untuk CSS processing
- **TypeScript** untuk type safety

---

## 📁 **Struktur Project**

```
loveable-english-spark/
├── src/
│   ├── components/
│   │   ├── teacher/           # Komponen portal guru
│   │   │   ├── TeacherLayout.tsx
│   │   │   ├── QuizManagement.tsx
│   │   │   ├── QuestionManager.tsx
│   │   │   ├── StudentsManagement.tsx
│   │   │   ├── QuizAssignment.tsx
│   │   │   └── Reports.tsx
│   │   ├── student/           # Komponen portal siswa
│   │   │   ├── StudentLayout.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── AssignedQuizzes.tsx
│   │   │   ├── QuizTaking.tsx
│   │   │   ├── QuizResults.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   └── StudyMaterials.tsx
│   │   └── ui/                # UI components
│   ├── pages/
│   │   ├── TeacherPortal.tsx
│   │   └── StudentPortal.tsx
│   ├── hooks/
│   ├── integrations/
│   │   └── supabase/
│   └── lib/
├── supabase/                  # Database schema & migrations
├── public/
└── docs/
```

---

## 🚀 **Installation & Setup**

### **Prerequisites**
- Node.js 18+ dan npm/yarn
- Akun Supabase
- Git

### **Quick Start**

1. **Clone Repository**
```bash
git clone <YOUR_GIT_URL>
cd loveable-english-spark
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env.local
# Edit .env.local dengan Supabase credentials Anda
```

4. **Database Setup**
- Buat project baru di [Supabase](https://supabase.com)
- Import schema dari folder `supabase/`
- Set up Row Level Security (RLS)

5. **Run Development Server**
```bash
npm run dev
```

6. **Open Browser**
```
http://localhost:5173
```

---

## 🎯 **Demo Workflow**

### **1. Setup Guru**
```bash
# Login sebagai guru atau sign up
# Akses: Teacher Portal
```

### **2. Buat Quiz & Siswa**
- Buat quiz baru dengan template
- Tambah soal-soal
- Tambah siswa (password default: `student123`)
- Assign quiz ke kelas

### **3. Login Siswa**
```bash
# Email: [nama.siswa]@gmail.com
# Password: student123
```

### **4. Workflow Siswa**
- Login → Dashboard
- Lihat assigned quizzes
- Ambil quiz → interactive experience
- Lihat hasil → achievement unlocked
- Check leaderboard & study materials

---

## 📊 **Database Schema**

### **Main Tables**
- `students` - Data siswa
- `classes` - Data kelas
- `quizzes` - Data quiz
- `questions` - Soal quiz
- `quiz_assignments` - Assignment quiz ke kelas
- `user_progress` - Progress dan hasil siswa
- `user_roles` - Role management

### **Auth Integration**
- Supabase Auth untuk login/logout
- RLS policies untuk data security
- Role-based access control

---

## 🔒 **Security Features**

- **Row Level Security (RLS)** pada semua tabel
- **JWT Authentication** via Supabase
- **Role-based permissions** (teacher/student)
- **Password hashing** otomatis
- **HTTPS enforcement** di production

---

## 🎨 **UI/UX Highlights**

### **Design System**
- **Modern & Clean**: Menggunakan Tailwind + Shadcn/UI
- **Responsive**: Mobile-first approach
- **Dark/Light Mode**: Theme switching support
- **Accessibility**: ARIA labels dan keyboard navigation

### **Gamification Elements**
- **Progress Bars**: Visual feedback untuk kemajuan
- **Achievement Animations**: Celebration saat unlock badge
- **Color Psychology**: Green untuk success, blue untuk info
- **Interactive Elements**: Hover effects dan transitions

---

## 🚀 **Production Deployment**

### **Recommended Platforms**
- **Vercel** (Recommended untuk React)
- **Netlify** 
- **Supabase Hosting**

### **Build Commands**
```bash
# Build untuk production
npm run build

# Preview build
npm run preview
```

### **Environment Variables**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📈 **Performance**

### **Optimization**
- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: Optimized assets
- **Bundle Analysis**: Tree shaking enabled
- **Caching**: Service worker ready

### **Monitoring**
- **Real-time Updates**: Supabase subscriptions
- **Error Tracking**: Console error handling
- **Performance Metrics**: Web Vitals ready

---

## 🧪 **Testing**

### **Manual Testing Checklist**
- ✅ Teacher create quiz → add questions
- ✅ Teacher add student → student can login
- ✅ Teacher assign quiz → student receives
- ✅ Student take quiz → results tracked
- ✅ Achievement system working
- ✅ Leaderboard updates real-time

---

## 🤝 **Contributing**

### **Development Guidelines**
1. **Fork** repository
2. **Create branch**: `feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### **Code Standards**
- TypeScript untuk type safety
- ESLint untuk code quality
- Prettier untuk formatting
- Conventional commits

---

## 📞 **Support**

### **Documentation**
- [DEMO_INSTRUCTIONS.md](./DEMO_INSTRUCTIONS.md) - Panduan demo
- [CHANGELOG_MEMORY.md](./CHANGELOG_MEMORY.md) - History development
- [TESTING_ASSIGNMENT_INTEGRATION.md](./TESTING_ASSIGNMENT_INTEGRATION.md) - Testing guide

### **Contact**
- 📧 Email: support@loveable-english-spark.com
- 🐛 Issues: [GitHub Issues](link-to-issues)
- 💬 Discussions: [GitHub Discussions](link-to-discussions)

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎉 **MVP Status: 100% COMPLETE!**

**🔥 GANBARIMASU ACHIEVED!** 

Portal lengkap untuk guru dan siswa dengan sistem gamifikasi yang komprehensif. Siap untuk production deployment!

### **Core Features Complete:**
- ✅ **Teacher Portal**: Quiz, Students, Assignment Management
- ✅ **Student Portal**: Interactive Learning Experience
- ✅ **Gamification**: Points, Levels, Achievements, Leaderboard
- ✅ **Real-time Integration**: Live assignment tracking
- ✅ **Modern UI/UX**: Responsive dan accessible

---

**Made with ❤️ for SMK Students Learning English**

<img width="939" height="433" alt="Screenshot_150" src="https://github.com/user-attachments/assets/b022f941-6283-4e68-9a14-de741bf28a72" />
<img width="943" height="495" alt="Screenshot_1" src="https://github.com/user-attachments/assets/29abfbab-40f2-4585-beb1-3ac2c4a54cb3" />
<img width="943" height="478" alt="Screenshot_2" src="https://github.com/user-attachments/assets/f14f375e-d985-4e43-9352-aa12682dc001" />
<img width="946" height="508" alt="Screenshot_3" src="https://github.com/user-attachments/assets/12dd081a-9f3e-470d-b0d5-c68949686934" />
<img width="928" height="481" alt="Screenshot_4" src="https://github.com/user-attachments/assets/095fcc64-51bb-449c-bc2a-265b633b208f" />
<img width="943" height="511" alt="Screenshot_5" src="https://github.com/user-attachments/assets/4b3c5801-e774-4c4c-81a9-db7fac31e5ef" />
<img width="936" height="459" alt="Screenshot_6" src="https://github.com/user-attachments/assets/cc0531c5-4c15-4590-8616-80227b1152cd" />
<img width="946" height="518" alt="Screenshot_7" src="https://github.com/user-attachments/assets/f48de676-6538-4f0d-b3b1-470cc6b89dcc" />
<img width="941" height="526" alt="Screenshot_8" src="https://github.com/user-attachments/assets/ac5e1d01-e51d-4579-b537-e340ca50ec65" />
<img width="904" height="523" alt="Screenshot_9" src="https://github.com/user-attachments/assets/149da251-1d8a-4ba2-b4ca-7575eee5fdef" />
<img width="943" height="510" alt="Screenshot_10" src="https://github.com/user-attachments/assets/05fe733a-9a4d-4b6c-a013-5d9ee45378ef" />
<img width="905" height="518" alt="Screenshot_11" src="https://github.com/user-attachments/assets/d85fd9de-0d27-4a61-8236-08b4d682fa07" />
<img width="937" height="519" alt="Screenshot_12" src="https://github.com/user-attachments/assets/4461bf2c-14f8-4b9f-8443-38c31e183640" />
<img width="918" height="514" alt="Screenshot_13" src="https://github.com/user-attachments/assets/fd06076b-096d-422a-ad0e-39d1cc974dd4" />
<img width="943" height="520" alt="Screenshot_14" src="https://github.com/user-attachments/assets/e45cb0e7-98fd-4bfd-833d-9dd7e3d67621" />
<img width="950" height="500" alt="Screenshot_15" src="https://github.com/user-attachments/assets/1b5f12f7-62d5-4d6e-979d-3c7f96166fdd" />
<img width="960" height="509" alt="Screenshot_16" src="https://github.com/user-attachments/assets/4ed53f76-11b2-44ba-879e-d9ce99986952" />
<img width="952" height="498" alt="Screenshot_17" src="https://github.com/user-attachments/assets/3e184537-5859-4d5e-9565-7cd2b0976886" />
<img width="768" height="489" alt="Screenshot_18" src="https://github.com/user-attachments/assets/1d21d663-4d7d-4ad8-92cb-8d7484442011" />
<img width="648" height="480" alt="Screenshot_19" src="https://github.com/user-attachments/assets/f1b47ab7-819b-4b20-bffc-2c95e6beed0e" />
<img width="957" height="538" alt="Screenshot_20" src="https://github.com/user-attachments/assets/4467affd-d262-4274-b171-056a6fe240c0" />
<img width="935" height="515" alt="Screenshot_21" src="https://github.com/user-attachments/assets/eb21f5bf-6757-43d0-bd17-ccff97572dff" />
<img width="936" height="516" alt="Screenshot_22" src="https://github.com/user-attachments/assets/98c7c1b8-3c8f-4017-99c5-dd226c157943" />
<img width="781" height="503" alt="Screenshot_23" src="https://github.com/user-attachments/assets/e27c58bb-17f9-4e9d-9c40-590611fc6e9e" />
<img width="959" height="487" alt="Screenshot_24" src="https://github.com/user-attachments/assets/dce2d2b9-1269-41c2-bbc9-8390ea79bb88" />
<img width="932" height="494" alt="Screenshot_25" src="https://github.com/user-attachments/assets/798b8636-ad40-4774-8f25-ecbcbf3429cc" />
<img width="948" height="525" alt="Screenshot_26" src="https://github.com/user-attachments/assets/3b5171af-4aff-49bd-9843-9d68e3fc20a2" />
<img width="922" height="492" alt="Screenshot_27" src="https://github.com/user-attachments/assets/61b9ae73-677b-4044-a79d-5fb4e4f249ae" />
<img width="888" height="485" alt="Screenshot_28" src="https://github.com/user-attachments/assets/eaf77d20-017c-4fd0-b890-87c7708c3099" />


