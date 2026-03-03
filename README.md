# KPI Management System v3

Modern KPI (Key Performance Indicator) monitoring and tracking system built with Next.js, TailwindCSS, and PostgreSQL (via Drizzle ORM). Contains advanced Role-Based Access Controls (RBAC), multi-tier organizational charts, and full audit trails.

## Database & Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS & shadcn/ui
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Custom SSR session headers

## Prasyarat Instalasi

Sebelum memulai, pastikan sistem Anda telah menginstal:
1. [Node.js](https://nodejs.org/en/) (minimal v18.17.0)
2. [PostgreSQL](https://postgresql.org) Database (Lokal atau Cloud seperti Neon/Supabase)
3. Akun Github (opsional, jika ingin berkontribusi)

## Panduan Instalasi (How to Deploy / Install)

### 1. Kloning Repositori
Lakukan *cloning* repositori ini ke komputer Anda.
```bash
git clone https://github.com/Tahatra21/KPI.git
cd KPI
```

### 2. Install Dependensi (Library)
Install seluruh pustaka dengan NPM.
```bash
npm install
# atau
yarn install
```

### 3. Persiapkan Environment (.env)
Buat fail bernama `.env.local` di root folder proyek ini, dan salin konfigurasi *database* PostgreSQL Anda:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/kpiv3"
```
*(Ganti isinya menyesuaikan database Anda)*

### 4. Men-generate dan Migrasi Skema Database
Sistem KPI akan membuat otomatis struktur tabel berserta relasinya (Foreign Keys / Alerts / Audit Logs / Dll).
```bash
npm run db:generate
npm run db:migrate
```

### 5. Seeding Database (Data Uji Coba)
Agar aplikasi dapat dicoba tanpa mendaftar ulang, sistem ini dilengkapi *dummy data* lengkap dari level 0 (Admin) hingga level 4 (Staff).
```bash
npm run db:seed
```

Daftar pengguna otomatis / Akses *default*:
- **Admin**: `ADM001` - `password123`
- **VP / BOD-1**: `VP001` - `password123`
- **Manager**: `MGR001` - `password123`
- **Assistant Manager**: `AM001` - `password123`
- **Staff**: `STF001` - `password123`

### 6. Menjalankan Server (Local Development)
Jalankan server Node.js pada lingkungan lokal.
```bash
npm run dev
```
Buka browser Anda dan akses: **http://localhost:3000** 🚀

---
*Developed & maintained for modern enterprise tracking* 
