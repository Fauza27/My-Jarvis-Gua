# 📚 Sprint 1 - Learning Guide

**Sprint Goal:** Setup project foundation dan pahami tech stack

**Target:** Selesai dalam 2 minggu (3-4 jam/hari)

---

## 🎯 Learning Objectives

Setelah Sprint 1, kamu harus bisa:
1. Setup monorepo dengan Next.js + FastAPI
2. Konfigurasi PostgreSQL dan koneksi database
3. Membuat REST API sederhana
4. Membuat UI component dengan Tailwind CSS
5. Deploy ke production (Vercel + Railway)

---

## 📅 Week 1: Setup & Backend Foundation

### Day 1-2: Monorepo Setup & Next.js

**Apa yang harus dipelajari:**
- Apa itu monorepo dan kenapa menggunakannya
- Next.js 14 App Router (bukan Pages Router!)
- TypeScript basics untuk React

**Materi Wajib:**

1. **Monorepo Concept** (30 menit)
   - 📖 Baca: https://monorepo.tools/
   - 🎯 Fokus: Kenapa monorepo? Kapan pakai monorepo?

2. **Next.js 14 Official Tutorial** (2-3 jam)
   - 📖 Docs: https://nextjs.org/learn
   - 🎯 Fokus: 
     - App Router (bukan Pages Router!)
     - Server Components vs Client Components
     - File-based routing
     - Layout dan nested routes
   - ⚠️ PENTING: Next.js 14 pakai App Router, bukan Pages Router!

3. **TypeScript for React** (1-2 jam)
   - 📖 Docs: https://react-typescript-cheatsheet.netlify.app/
   - 🎯 Fokus:
     - Props typing
     - useState dengan TypeScript
     - Event handlers typing

**Praktik:**
- [ ] Buat Next.js project: `npx create-next-app@latest`
- [ ] Explore struktur folder `app/`
- [ ] Buat 2-3 halaman sederhana (home, about, contact)
- [ ] Buat 1 component dengan props typing

**Resources:**
- Video: "Next.js 14 Tutorial" di YouTube (cari yang terbaru 2024)
- Cheatsheet: https://nextjs.org/docs

---

### Day 3-4: FastAPI & Python Backend

**Apa yang harus dipelajari:**
- FastAPI framework basics
- Pydantic untuk data validation
- Async/await di Python
- REST API design principles

**Materi Wajib:**

1. **FastAPI Official Tutorial** (3-4 jam)
   - 📖 Docs: https://fastapi.tiangolo.com/tutorial/
   - 🎯 Fokus:
     - First Steps (Hello World)
     - Path Parameters
     - Query Parameters
     - Request Body (Pydantic models)
     - Response Model
   - ⚠️ Baca sampai "Tutorial - User Guide" bagian 1-10

2. **Pydantic Basics** (1 jam)
   - 📖 Docs: https://docs.pydantic.dev/latest/
   - 🎯 Fokus:
     - Models
     - Field validation
     - Type hints

3. **REST API Best Practices** (30 menit)
   - 📖 Baca: https://restfulapi.net/
   - 🎯 Fokus:
     - HTTP methods (GET, POST, PUT, DELETE)
     - Status codes (200, 201, 400, 404, 500)
     - URL naming conventions

**Praktik:**
- [ ] Install FastAPI: `pip install fastapi uvicorn`
- [ ] Buat simple API dengan 3 endpoints (GET, POST, DELETE)
- [ ] Test dengan browser (FastAPI auto docs di `/docs`)
- [ ] Buat Pydantic model untuk validation

**Resources:**
- Video: "FastAPI Tutorial" di YouTube (cari yang lengkap)
- Playground: Coba di local dulu sebelum integrate

---

### Day 5-6: PostgreSQL & Database Design

**Apa yang harus dipelajari:**
- Relational database concepts
- PostgreSQL basics
- SQL queries (CRUD operations)
- Database schema design
- SQLAlchemy ORM

**Materi Wajib:**

1. **PostgreSQL Basics** (2 jam)
   - 📖 Tutorial: https://www.postgresqltutorial.com/
   - 🎯 Fokus:
     - SELECT, INSERT, UPDATE, DELETE
     - WHERE, ORDER BY, LIMIT
     - JOIN (INNER, LEFT)
     - Primary Key, Foreign Key
   - ⚠️ Cukup baca bagian "PostgreSQL Tutorial" (1-15)

2. **Database Design Principles** (1 jam)
   - 📖 Baca: https://www.guru99.com/database-design.html
   - 🎯 Fokus:
     - Normalization (1NF, 2NF, 3NF)
     - Relationships (One-to-Many, Many-to-Many)
     - Indexes

3. **SQLAlchemy 2.0 Tutorial** (2-3 jam)
   - 📖 Docs: https://docs.sqlalchemy.org/en/20/tutorial/
   - 🎯 Fokus:
     - Declarative models
     - Session management
     - Query API
     - Relationships
   - ⚠️ Baca sampai "Working with Data"

**Praktik:**
- [ ] Install PostgreSQL locally (atau pakai Docker)
- [ ] Buat database `lifeos_dev`
- [ ] Buat 2-3 tabel dengan SQL
- [ ] Practice CRUD queries di psql atau pgAdmin
- [ ] Install SQLAlchemy: `pip install sqlalchemy psycopg2-binary`
- [ ] Install Alembic (migration tool): `pip install alembic`
- [ ] Buat model User dengan SQLAlchemy
- [ ] Test koneksi database

**Resources:**
- Install: https://www.postgresql.org/download/
- GUI Tool: pgAdmin atau DBeaver (pilih salah satu)
- Video: "PostgreSQL Tutorial for Beginners"

---

### Day 7: Integration (Next.js + FastAPI)

**Apa yang harus dipelajari:**
- CORS (Cross-Origin Resource Sharing)
- Fetch API / Axios
- Environment variables
- API integration patterns

**Materi Wajib:**

1. **CORS Explained** (30 menit)
   - 📖 Baca: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
   - 🎯 Fokus: Kenapa CORS error? Cara fix di FastAPI

2. **Fetch API** (1 jam)
   - 📖 Docs: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
   - 🎯 Fokus:
     - GET request
     - POST request dengan body
     - Error handling
     - Async/await

3. **Environment Variables** (30 menit)
   - 📖 Next.js: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
   - 📖 Python: https://pypi.org/project/python-dotenv/
   - 🎯 Fokus: Cara simpan API URL, database credentials

**Praktik:**
- [ ] Setup CORS di FastAPI
- [ ] Buat `.env` file untuk Next.js dan FastAPI
- [ ] Fetch data dari FastAPI di Next.js component
- [ ] Handle loading state dan error state

**Resources:**
- Tool: Postman atau Thunder Client (untuk test API)

---

## 📅 Week 2: UI, Auth & Deployment

### Day 8-9: Tailwind CSS & UI Components

**Apa yang harus dipelajari:**
- Tailwind CSS utility classes
- Responsive design
- Component composition
- shadcn/ui component library

**Materi Wajib:**

1. **Tailwind CSS Fundamentals** (2-3 jam)
   - 📖 Docs: https://tailwindcss.com/docs
   - 🎯 Fokus:
     - Utility classes (margin, padding, colors, typography)
     - Flexbox & Grid
     - Responsive design (sm:, md:, lg:)
     - Dark mode
   - ⚠️ Jangan hafalkan, pakai sebagai reference!

2. **shadcn/ui Components** (1-2 jam)
   - 📖 Docs: https://ui.shadcn.com/
   - 🎯 Fokus:
     - Installation
     - Button, Input, Card components
     - Form components
     - Cara customize
   - ⚠️ Ini bukan library, tapi copy-paste components!

**Praktik:**
- [ ] Install Tailwind di Next.js project
- [ ] Buat layout dengan Tailwind (header, sidebar, content)
- [ ] Install shadcn/ui: `npx shadcn-ui@latest init`
- [ ] Add 3-4 components (Button, Input, Card)
- [ ] Buat form sederhana dengan validation

**Resources:**
- Playground: https://play.tailwindcss.com/
- Video: "Tailwind CSS Crash Course"
- Inspiration: https://tailwindui.com/ (lihat contoh, jangan beli)

---

### Day 10-11: Authentication (NextAuth.js)

**Apa yang harus dipelajari:**
- Authentication vs Authorization
- JWT (JSON Web Tokens)
- Session management
- NextAuth.js v5 (Auth.js)

**Materi Wajib:**

1. **Auth Concepts** (1 jam)
   - 📖 Baca: https://auth0.com/intro-to-iam/what-is-authentication
   - 🎯 Fokus:
     - Authentication vs Authorization
     - Session-based vs Token-based
     - OAuth 2.0 basics

2. **NextAuth.js v5 Tutorial** (3-4 jam)
   - 📖 Docs: https://authjs.dev/getting-started/installation
   - 🎯 Fokus:
     - Installation (Next.js App Router)
     - Credentials provider
     - Session management
     - Protecting routes
   - ⚠️ PENTING: Pakai v5 (Auth.js), bukan v4!

3. **JWT Explained** (30 menit)
   - 📖 Baca: https://jwt.io/introduction
   - 🎯 Fokus: Struktur JWT, cara kerja, kapan pakai

**Praktik:**
- [ ] Install NextAuth: `npm install next-auth@beta`
- [ ] Setup credentials provider (email + password)
- [ ] Buat login page
- [ ] Protect 1-2 routes (redirect jika belum login)
- [ ] Test login/logout flow

**Resources:**
- Video: "NextAuth.js v5 Tutorial"
- Tool: https://jwt.io/ (decode JWT token)

---

### Day 12-13: Deployment & DevOps

**Apa yang harus dipelajari:**
- Git & GitHub workflow
- Vercel deployment (Next.js)
- Railway deployment (FastAPI + PostgreSQL)
- Environment variables di production

**Materi Wajib:**

1. **Git Basics** (1-2 jam) - Skip jika sudah paham
   - 📖 Tutorial: https://www.atlassian.com/git/tutorials
   - 🎯 Fokus:
     - git add, commit, push
     - Branching (main, dev)
     - .gitignore

2. **Vercel Deployment** (1 jam)
   - 📖 Docs: https://vercel.com/docs
   - 🎯 Fokus:
     - Connect GitHub repo
     - Environment variables
     - Automatic deployments
     - Custom domain (optional)

3. **Railway Deployment** (1-2 jam)
   - 📖 Docs: https://docs.railway.app/
   - 🎯 Fokus:
     - Deploy FastAPI
     - PostgreSQL database
     - Environment variables
     - Connect to Vercel

**Praktik:**
- [ ] Push code ke GitHub
- [ ] Deploy Next.js ke Vercel
- [ ] Deploy FastAPI ke Railway
- [ ] Setup PostgreSQL di Railway
- [ ] Test production URLs
- [ ] Setup environment variables

**Resources:**
- Video: "Deploy Next.js to Vercel"
- Video: "Deploy FastAPI to Railway"

---

### Day 14: Testing & Documentation

**Apa yang harus dipelajari:**
- Manual testing checklist
- API documentation (FastAPI auto docs)
- README best practices

**Materi Wajib:**

1. **FastAPI Auto Docs** (30 menit)
   - 📖 Docs: https://fastapi.tiangolo.com/tutorial/metadata/
   - 🎯 Fokus:
     - Swagger UI (/docs)
     - ReDoc (/redoc)
     - Add descriptions

2. **README Best Practices** (30 menit)
   - 📖 Baca: https://www.makeareadme.com/
   - 🎯 Fokus: Struktur README yang baik

**Praktik:**
- [ ] Test semua endpoints di production
- [ ] Test login flow di production
- [ ] Update README dengan setup instructions
- [ ] Add screenshots ke README
- [ ] Sprint 1 retrospective (isi template)

---

## 🎯 Sprint 1 Checklist

### Must Have (P0):
- [ ] Monorepo structure (frontend + backend)
- [ ] Next.js 14 running
- [ ] FastAPI running
- [ ] PostgreSQL connected
- [ ] 1 API endpoint working (GET /api/health)
- [ ] 1 page with Tailwind CSS
- [ ] Basic auth (login/logout)
- [ ] Deployed to production

### Nice to Have (P1):
- [ ] shadcn/ui components
- [ ] Protected routes
- [ ] Error handling
- [ ] Loading states

### Can Skip (P2):
- [ ] Unit tests (Sprint 20)
- [ ] CI/CD pipeline (Sprint 19)
- [ ] Monitoring (Sprint 19)

---

## 💡 Learning Tips

### 1. Jangan Baca Semua Sekaligus:
- Baca materi → Langsung praktik
- Jangan hafalkan, pakai docs sebagai reference
- Fokus pada "how to use", bukan "how it works internally"

### 2. Gunakan AI Assistant (ChatGPT, Claude):
- Tanya jika stuck
- Minta explain error message
- Jangan minta jawaban langsung, minta hint

### 3. Debug Mindset:
- Baca error message dengan teliti
- Google error message
- Check Stack Overflow
- Coba isolate problem (test di file terpisah)

### 4. Time Management:
- 3-4 jam/hari = 42-56 jam/2 minggu
- Sprint 1 estimate: 48 jam
- Sisakan buffer untuk debugging

### 5. Jangan Perfectionist:
- Sprint 1 = Foundation, bukan final product
- Boleh jelek, yang penting jalan
- Refactor nanti (Sprint 19)

---

## 📚 Recommended Learning Path

### Jika Kamu Sudah Paham:
- ✅ JavaScript/TypeScript → Skip Day 1-2, langsung Next.js
- ✅ Python → Skip FastAPI basics, langsung praktik
- ✅ SQL → Skip PostgreSQL tutorial, langsung SQLAlchemy
- ✅ Git → Skip Git basics

### Jika Kamu Pemula Total:
- Tambah 1 minggu untuk belajar JavaScript/TypeScript basics
- Tambah 3-4 hari untuk belajar Python basics
- Ikuti learning path di atas step-by-step

---

## 🆘 Troubleshooting Resources

### Stuck di Next.js:
- Docs: https://nextjs.org/docs
- Discord: https://discord.gg/nextjs
- Reddit: r/nextjs

### Stuck di FastAPI:
- Docs: https://fastapi.tiangolo.com/
- Discord: https://discord.gg/fastapi
- Reddit: r/FastAPI

### Stuck di PostgreSQL:
- Docs: https://www.postgresql.org/docs/
- Stack Overflow: Tag [postgresql]

### Stuck di Deployment:
- Vercel: https://vercel.com/support
- Railway: https://discord.gg/railway

---

## 🎉 Sprint 1 Success Criteria

Kamu berhasil jika:
- ✅ Bisa run Next.js di local (localhost:3000)
- ✅ Bisa run FastAPI di local (localhost:8000)
- ✅ Bisa connect ke PostgreSQL
- ✅ Bisa fetch data dari FastAPI ke Next.js
- ✅ Bisa login/logout
- ✅ Deployed ke production dan bisa diakses

**Jangan khawatir jika:**
- ❌ Code masih berantakan (refactor nanti)
- ❌ UI masih jelek (polish nanti)
- ❌ Belum ada tests (Sprint 20)
- ❌ Performance belum optimal (Sprint 19)

---

## 📝 Daily Log Template

Gunakan ini untuk track progress:

```markdown
## Day X - [Date]

### What I Learned:
- 

### What I Built:
- 

### Challenges:
- 

### Tomorrow's Plan:
- 

### Time Spent: X hours
```

---

## 🚀 Next Steps After Sprint 1

Setelah Sprint 1 selesai:
1. Fill Sprint Retrospective Template
2. Review velocity (actual vs estimated)
3. Read Sprint 2 Learning Guide (akan dibuat)
4. Adjust Sprint 2 tasks based on learnings

---

**Good luck! You got this! 💪**

**Remember:** Belajar itu proses, bukan hasil. Enjoy the journey! 🎯

---

**Created:** February 2025  
**Sprint:** 1 of 24  
**Status:** Ready to Start 🚀
