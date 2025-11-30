# Student Onboarding Tour Implementation

## Overview
Implementasi tour onboarding khusus untuk siswa menggunakan Intro.js pada aplikasi English Spark. Tour ini hanya muncul untuk user dengan role 'student' dan pada login pertama kali.

## Fitur Utama

### 1. Role Detection
- Mengecek role user dari session/authentication
- Hanya menampilkan tour untuk `user.role === 'student'`
- Menggunakan hook `useAuth()` untuk validasi role

### 2. First-Time Detection
- Menyimpan status tour di localStorage
- Key: `studentTourCompleted` dan `studentTour_${userId}`
- Fungsi `isFirstTimeStudent()` untuk mengecek status

### 3. Tour Steps (12 langkah)
1. **Welcome Message**: Sambutan dan penjelasan tour
2. **Total Points**: Penjelasan sistem poin
3. **Current Level**: Level progression system
4. **Streak Days**: Sistem streak harian
5. **Class Rank**: Ranking dalam kelas
6. **Level Progress**: Progress bar level
7. **Assigned Quizzes**: Quiz yang di-assign teacher
8. **Quiz Results**: Menu hasil quiz
9. **Leaderboard**: Ranking global
10. **Study Materials**: Materi belajar
11. **Achievements**: Sistem achievement
12. **Profile**: Management profile

### 4. Interactive Elements
- **FirstTimeWelcome Card**: Pop-up sambutan untuk first-time user
- **TourControl**: Tombol untuk mengulang tour
- **Data attributes**: Setiap elemen tour diberi `data-tour` attribute

## Implementasi

### Dependencies
```bash
npm install intro.js @types/intro.js
```

### File Structure
```
src/
├── hooks/
│   └── useStudentTour.tsx          # Hook untuk manajemen tour
├── components/student/
│   ├── FirstTimeWelcome.tsx        # Welcome card untuk first-time user
│   ├── TourControl.tsx             # Kontrol manual tour
│   ├── StudentDashboard.tsx        # Dashboard dengan data-tour attributes
│   └── StudentSidebar.tsx          # Sidebar dengan data-tour attributes
└── pages/
    └── StudentPortal.tsx           # Main entry point
```

### Key Components

#### 1. useStudentTour Hook
```typescript
const { 
  initializeTour,      // Inisialisasi otomatis tour
  restartTour,         // Manual restart tour
  resetTourStatus,     // Reset status tour (development)
  isFirstTimeStudent,  // Check first time status
  isStudent           // Check if user is student
} = useStudentTour();
```

#### 2. Data Attributes
Setiap elemen yang menjadi bagian tour memiliki `data-tour` attribute:
```tsx
<div data-tour="total-points">
  <StatCard title="Total Points" ... />
</div>
```

#### 3. Styling
Tour menggunakan custom CSS dengan theme purple-blue gradient:
- Modern card design dengan border radius
- Smooth transitions dan hover effects
- Responsive design
- Dark/light mode compatible

## Usage

### Automatic Tour
Tour akan otomatis muncul ketika:
1. User memiliki role 'student'
2. Belum pernah menyelesaikan tour sebelumnya
3. Dashboard sudah selesai di-render

### Manual Tour
User dapat mengulang tour melalui:
1. **TourControl component** di header (icon help)
2. **FirstTimeWelcome card** (button "Mulai Tour")

### Development Mode
Dalam development mode, tersedia tombol untuk reset tour status.

## Customization

### Menambah Step Baru
Edit array `studentTourSteps` di `useStudentTour.tsx`:
```typescript
{
  element: '[data-tour="new-element"]',
  title: 'Judul Step',
  intro: 'Penjelasan step...',
  position: 'bottom'
}
```

### Mengubah Styling
Edit function `addTourStyles()` untuk custom CSS.

### Mengubah Kondisi Tour
Edit function `checkUserRole()` dan `isFirstTimeStudent()` sesuai kebutuhan.

## Testing

### Reset Tour Status
```javascript
// Development mode only
localStorage.removeItem('studentTourCompleted');
localStorage.removeItem(`studentTour_${userId}`);
```

### Manual Testing
1. Login sebagai student baru
2. Tour akan muncul otomatis
3. Test semua langkah tour
4. Verify localStorage status
5. Test manual restart tour

## Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Performance Notes
- Tour CSS di-inject saat dibutuhkan
- Lazy loading untuk element checking
- Minimal impact pada initial load
- Memory cleanup saat component unmount
