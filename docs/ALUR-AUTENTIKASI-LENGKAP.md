# 🔐 Alur Autentikasi Lengkap - My Jarvis Gua

## 📋 Daftar Isi
1. [Arsitektur Sistem](#arsitektur-sistem)
2. [Alur Register](#alur-register)
3. [Alur Login](#alur-login)
4. [Alur OAuth (Google)](#alur-oauth-google)
5. [Alur Verifikasi Token](#alur-verifikasi-token)
6. [Alur Refresh Token](#alur-refresh-token)
7. [Alur Logout](#alur-logout)
8. [Alur Forgot Password](#alur-forgot-password)
9. [File-File Penting](#file-file-penting)

---

## 🏗️ Arsitektur Sistem

Sistem menggunakan arsitektur **Clean Architecture** dengan pemisahan layer:

```
Frontend (Next.js)          Backend (FastAPI)           Database
─────────────────          ──────────────────          ─────────
UI Components    ──────>   API Endpoints      ──────>  Supabase
     ↓                          ↓                       (PostgreSQL)
API Client       ──────>   Service Layer      ──────>  Auth Tables
     ↓                          ↓
State Store      ──────>   Repository Layer
(Zustand)                      ↓
                          Supabase Client
```

### Stack Teknologi:
- **Frontend**: Next.js 14, TypeScript, Zustand, React Hook Form, Zod
- **Backend**: FastAPI, Python, Pydantic
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Token**: JWT (JSON Web Token)

---

## 📝 Alur Register

### 1️⃣ **Frontend: User Input** 
📁 `frontend/src/app/(auth)/register/page.tsx`
- User mengisi form email & password
- Komponen `RegisterForm` di-render

### 2️⃣ **Frontend: Form Validation**
📁 `frontend/src/features/auth/components/RegisterForm.tsx`
- Form menggunakan `react-hook-form` dengan `zodResolver`
- Validasi client-side dengan Zod schema

📁 `frontend/src/features/auth/validations/authSchema.ts`
```typescript
registerSchema = {
  email: EmailStr (max 254 char, lowercase, trim)
  password: min 8 char, max 128 char
    - Harus ada uppercase
    - Harus ada lowercase  
    - Harus ada digit
    - Harus ada special character
  confirmPassword: harus match dengan password
}
```

### 3️⃣ **Frontend: API Call**
📁 `frontend/src/features/auth/api/authApi.ts`
```typescript
register(email, password)
  → POST /api/auth/register
  → Headers: Content-Type: application/json
  → Body: { email, password }
```

### 4️⃣ **Backend: Entry Point**
📁 `backend/app/main.py`
- Uvicorn server menerima request
- Routing ke FastAPI application

📁 `backend/app/core/application.py`
- CORS middleware memvalidasi origin
- Request di-route ke auth router

### 5️⃣ **Backend: API Endpoint**
📁 `backend/app/api/auth.py`
```python
@router.post("/auth/register")
async def register(body: RegisterRequest, service: AuthService)
  → Validasi input dengan Pydantic
  → Panggil service.register()
  → Return MessageOut
```

### 6️⃣ **Backend: Model Validation**
📁 `backend/app/models/auth.py`
```python
RegisterRequest:
  - email: EmailStr, max 254, lowercase, trim
  - password: min 8, max 128
    • Validasi strength (uppercase, lowercase, digit, special char)
```

### 7️⃣ **Backend: Service Layer**
📁 `backend/app/services/auth_service.py`
```python
AuthService.register(email, password, redirect_url)
  → Panggil auth_repo.register()
  → Return success message
```

### 8️⃣ **Backend: Repository Layer**
📁 `backend/app/repositories/auth_repository.py`
```python
AuthRepository.register(email, password, redirect_url)
  → Panggil Supabase client
  → supabase.auth.sign_up({
      email, password,
      options: { emailRedirectTo: redirect_url }
    })
  → Handle error (user already exists, dll)
```

### 9️⃣ **Backend: Supabase Client**
📁 `backend/app/infrastructure/supabase_client.py`
```python
get_supabase_client()
  → Create Supabase client dengan:
    - SUPABASE_URL
    - SUPABASE_ANON_KEY
```

### 🔟 **Backend: Configuration**
📁 `backend/app/core/config.py`
```python
Settings:
  - SUPABASE_URL (validated HTTPS)
  - SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - SUPABASE_JWT_SECRET
  - FRONTEND_URL
  - auth_redirect_url = f"{FRONTEND_URL}/callback"
```

### 1️⃣1️⃣ **Supabase: Create User**
- Supabase membuat user baru di database
- Hash password dengan bcrypt
- Generate confirmation token
- Kirim email konfirmasi ke user

### 1️⃣2️⃣ **Backend: Response**
- Return `{ message: "Registration successful. Please check your email to confirm." }`
- Status code: 201 Created

### 1️⃣3️⃣ **Frontend: Handle Response**
📁 `frontend/src/features/auth/components/RegisterForm.tsx`
- Tampilkan success message
- Redirect ke halaman login atau info page

### 1️⃣4️⃣ **User: Email Confirmation**
- User klik link di email
- Redirect ke `{FRONTEND_URL}/callback?token=...`
- Callback page handle token verification

---

## 🔑 Alur Login

### 1️⃣ **Frontend: User Input**
📁 `frontend/src/app/(auth)/login/page.tsx`
- User mengisi email & password
- Komponen `LoginForm` di-render

### 2️⃣ **Frontend: Form Validation**
📁 `frontend/src/features/auth/components/LoginForm.tsx`
- Validasi dengan `loginSchema` (Zod)

📁 `frontend/src/features/auth/validations/authSchema.ts`
```typescript
loginSchema = {
  email: EmailStr (max 254, lowercase, trim)
  password: string (max 128)
}
```

### 3️⃣ **Frontend: API Call**
📁 `frontend/src/features/auth/api/authApi.ts`
```typescript
login(email, password)
  → POST /api/auth/login
  → Body: { email, password }
  → Return: TokenOut
```

### 4️⃣ **Backend: API Endpoint**
📁 `backend/app/api/auth.py`
```python
@router.post("/auth/login")
async def login(body: LoginRequest, service: AuthService)
  → Validasi input
  → Panggil service.login()
  → Return TokenOut
```

### 5️⃣ **Backend: Service Layer**
📁 `backend/app/services/auth_service.py`
```python
AuthService.login(email, password)
  → Panggil auth_repo.login()
  → Extract session & user dari response
  → Return TokenOut {
      access_token,
      refresh_token,
      expires_at,
      user: { id, email, created_at, email_confirmed }
    }
```

### 6️⃣ **Backend: Repository Layer**
📁 `backend/app/repositories/auth_repository.py`
```python
AuthRepository.login(email, password)
  → supabase.auth.sign_in_with_password({ email, password })
  → Handle errors:
    - Email not confirmed → EmailNotConfirmedError
    - Invalid credentials → AuthenticationError
  → Return response (session + user)
```

### 7️⃣ **Supabase: Authenticate**
- Verify email & password
- Generate JWT access token (expires in 1 hour)
- Generate refresh token (expires in 7 days)
- Return session data

### 8️⃣ **Backend: Response**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "v1.MR5...",
  "expires_at": 1234567890,
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z",
    "email_confirmed": true
  }
}
```

### 9️⃣ **Frontend: Store Auth State**
📁 `frontend/src/features/auth/store.ts`
```typescript
useAuthStore.setAuth(access_token, refresh_token, expires_at, user)
  → Simpan ke Zustand store
  → Persist ke localStorage
  → Set isAuthenticated = true
```

📁 `frontend/src/features/auth/types.ts`
```typescript
AuthState = {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  isAuthenticated: boolean
  hasHydrated: boolean
  lastUpdate: number
}
```

### 🔟 **Frontend: Redirect**
- Redirect ke `/dashboard`
- Protected routes dapat akses user data dari store

---

## 🌐 Alur OAuth (Google)

### 1️⃣ **Frontend: User Click Google Button**
📁 `frontend/src/app/(auth)/login/page.tsx`
```typescript
handleGoogleLogin()
  → Import Supabase client
  → supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: '/callback' }
    })
```

### 2️⃣ **Frontend: Supabase Client**
📁 `frontend/src/lib/supabase.ts`
```typescript
createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    detectSessionInUrl: true,
    persistSession: false,
    flowType: "implicit"
  }
})
```

### 3️⃣ **Supabase: OAuth Flow**
- Generate OAuth URL untuk Google
- Redirect user ke Google login page
- User login & authorize app
- Google redirect kembali ke Supabase
- Supabase generate tokens

### 4️⃣ **Frontend: Callback Handler**
📁 `frontend/src/app/(auth)/callback/page.tsx`
```typescript
handleCallback()
  → Check URL params untuk error
  → Detect flow type (PKCE atau Implicit)
  
  // PKCE Flow (dengan code parameter)
  if (code) {
    → supabase.auth.exchangeCodeForSession(code)
    → Get session dari response
  }
  
  // Implicit Flow (tokens di URL hash)
  else {
    → Parse tokens dari URL hash
    → supabase.auth.setSession({ access_token, refresh_token })
  }
```

### 5️⃣ **Frontend: Verify Token**
📁 `frontend/src/features/auth/api/authApi.ts`
```typescript
verifyToken(access_token)
  → GET /api/auth/verify
  → Headers: Authorization: Bearer {token}
  → Return: { valid, user_id, email }
```

### 6️⃣ **Backend: Verify Endpoint**
📁 `backend/app/api/auth.py`
```python
@router.get("/auth/verify")
async def verify_token(current_user: CurrentUser)
  → Dependency injection get_current_user()
  → Return user info
```

### 7️⃣ **Backend: Token Verification**
📁 `backend/app/core/dependencies.py`
```python
get_current_user(authorization: Header, admin_supabase: Client)
  → Extract token dari header
  → Try: admin_supabase.auth.get_user(token)
  → Catch: Verify JWT manually dengan signature check
  → jwt.decode(token, JWT_SECRET, algorithms=["HS256", "ES256"])
  → Validate: exp, aud, signature
  → Return UserOut
```

### 8️⃣ **Frontend: Store & Redirect**
- Store tokens di Zustand
- Redirect ke `/dashboard`

---

## ✅ Alur Verifikasi Token

### 1️⃣ **Frontend: Protected Route Access**
- User mengakses protected route (e.g., `/dashboard`)
- Middleware atau component check auth state

### 2️⃣ **Frontend: Check Token Expiry**
📁 `frontend/src/features/auth/store.ts`
```typescript
isTokenExpired()
  → Compare current time dengan expiresAt
  → Return true jika expired

isTokenExpiringSoon()
  → Check jika token expire dalam 5 menit
  → Return true untuk trigger refresh
```

### 3️⃣ **Frontend: Auto Refresh**
📁 `frontend/src/features/auth/api/authApi.ts`
```typescript
getValidToken()
  → Check isTokenExpiringSoon()
  → If true: refreshToken(refresh_token)
  → Update store dengan new tokens
  → Return valid access_token
```

### 4️⃣ **Backend: Verify on Each Request**
📁 `backend/app/core/dependencies.py`
```python
get_current_user(authorization: Header)
  → Extract Bearer token
  → Try: Supabase get_user(token)
  → Fallback: JWT manual verification
    • Decode dengan JWT_SECRET
    • Verify signature (CRITICAL!)
    • Verify expiration
    • Verify audience
  → Return user object atau raise InvalidTokenError
```

### 5️⃣ **Backend: Protected Endpoint Example**
📁 `backend/app/api/profile.py` (contoh)
```python
@router.get("/profile")
async def get_profile(current_user: CurrentUser)
  → current_user sudah terverifikasi oleh dependency
  → Akses user.id, user.email
  → Return profile data
```

---

## 🔄 Alur Refresh Token

### 1️⃣ **Frontend: Token Expiring**
📁 `frontend/src/features/auth/api/authApi.ts`
```typescript
getValidToken()
  → isTokenExpiringSoon() = true
  → Call refreshToken(refresh_token)
```

### 2️⃣ **Frontend: Refresh API Call**
```typescript
refreshToken(refresh_token)
  → POST /api/auth/refresh
  → Body: { refresh_token }
  → Return: TokenOut (new tokens)
```

### 3️⃣ **Backend: Refresh Endpoint**
📁 `backend/app/api/auth.py`
```python
@router.post("/auth/refresh")
async def refresh_token(body: RefreshTokenRequest, service: AuthService)
  → Panggil service.refresh_session()
  → Return new TokenOut
```

### 4️⃣ **Backend: Service Layer**
📁 `backend/app/services/auth_service.py`
```python
AuthService.refresh_session(refresh_token)
  → Panggil auth_repo.refresh_session()
  → Extract new session & user
  → Return TokenOut dengan new tokens
```

### 5️⃣ **Backend: Repository Layer**
📁 `backend/app/repositories/auth_repository.py`
```python
AuthRepository.refresh_session(refresh_token)
  → supabase.auth.refresh_session(refresh_token)
  → Handle error: InvalidTokenError
  → Return new session
```

### 6️⃣ **Supabase: Generate New Tokens**
- Verify refresh token validity
- Generate new access token
- Generate new refresh token (rotation)
- Return new session

### 7️⃣ **Frontend: Update Store**
```typescript
setAuth(new_access_token, new_refresh_token, new_expires_at, user)
  → Update Zustand store
  → Persist ke localStorage
  → Continue dengan original request
```

---

## 🚪 Alur Logout

### 1️⃣ **Frontend: User Click Logout**
- User klik tombol logout di UI

### 2️⃣ **Frontend: Logout API Call**
📁 `frontend/src/features/auth/api/authApi.ts`
```typescript
logout(token)
  → POST /api/auth/logout
  → Headers: Authorization: Bearer {token}
```

### 3️⃣ **Backend: Logout Endpoint**
📁 `backend/app/api/auth.py`
```python
@router.post("/auth/logout")
async def logout(
  current_user: CurrentUser,  # Verify token
  access_token: AccessToken,  # Extract token
  service: AuthService
)
  → Panggil service.logout(access_token)
  → Return success message
```

### 4️⃣ **Backend: Service Layer**
📁 `backend/app/services/auth_service.py`
```python
AuthService.logout(access_token)
  → Panggil auth_repo.logout()
  → Return MessageOut
```

### 5️⃣ **Backend: Repository Layer**
📁 `backend/app/repositories/auth_repository.py`
```python
AuthRepository.logout(access_token)
  → Try: admin_client.auth.admin.sign_out(access_token)
  → Fallback: client.auth.sign_out()
  → Log warning jika gagal (non-critical)
```

### 6️⃣ **Supabase: Revoke Session**
- Invalidate access token
- Invalidate refresh token
- Remove session dari database

### 7️⃣ **Frontend: Clear State**
📁 `frontend/src/features/auth/store.ts`
```typescript
clearAuth()
  → Reset semua state ke initial
  → user = null
  → accessToken = null
  → refreshToken = null
  → isAuthenticated = false
  → Clear localStorage
```

### 8️⃣ **Frontend: Redirect**
- Redirect ke `/login`

---

## 🔐 Alur Forgot Password

### 1️⃣ **Frontend: User Request Reset**
📁 `frontend/src/app/(auth)/forgot-password/page.tsx`
- User input email
- Submit form

### 2️⃣ **Frontend: API Call**
📁 `frontend/src/features/auth/api/authApi.ts`
```typescript
forgotPassword(email)
  → POST /api/auth/forgot-password
  → Body: { email }
```

### 3️⃣ **Backend: Forgot Password Endpoint**
📁 `backend/app/api/auth.py`
```python
@router.post("/auth/forgot-password")
async def forgot_password(body: ResetPasswordRequest, service: AuthService)
  → Panggil service.request_password_reset()
  → Return generic message (security)
```

### 4️⃣ **Backend: Service Layer**
📁 `backend/app/services/auth_service.py`
```python
AuthService.request_password_reset(email, redirect_url)
  → Panggil auth_repo.request_password_reset()
  → Return: "If email is registered, reset link will be sent"
```

### 5️⃣ **Backend: Repository Layer**
📁 `backend/app/repositories/auth_repository.py`
```python
AuthRepository.request_password_reset(email, redirect_url)
  → supabase.auth.reset_password_for_email(
      email,
      options={ redirect_to: redirect_url }
    )
  → Log error tapi tidak throw (security)
```

### 6️⃣ **Backend: Config**
📁 `backend/app/core/config.py`
```python
password_reset_redirect_url = f"{FRONTEND_URL}/reset-password"
```

### 7️⃣ **Supabase: Send Reset Email**
- Check jika email exists
- Generate reset token
- Kirim email dengan link reset
- Link: `{FRONTEND_URL}/reset-password?token=...`

### 8️⃣ **Frontend: Reset Password Page**
📁 `frontend/src/app/(auth)/reset-password/page.tsx`
- Extract token dari URL
- User input new password
- Submit dengan token

### 9️⃣ **Frontend: Update Password**
```typescript
supabase.auth.updateUser({ password: new_password })
  → Supabase verify token & update password
```

### 🔟 **Frontend: Redirect**
- Success message
- Redirect ke `/login`

---

## 📂 File-File Penting

### Backend Files (Urutan Eksekusi)

1. **Entry Point**
   - `backend/app/main.py` - Uvicorn server startup

2. **Application Setup**
   - `backend/app/core/application.py` - FastAPI app creation, middleware, routers
   - `backend/app/core/config.py` - Environment variables & settings

3. **Infrastructure**
   - `backend/app/infrastructure/supabase_client.py` - Supabase client factory

4. **API Layer**
   - `backend/app/api/auth.py` - Auth endpoints (register, login, logout, dll)

5. **Models**
   - `backend/app/models/auth.py` - Pydantic models untuk request/response

6. **Service Layer**
   - `backend/app/services/auth_service.py` - Business logic

7. **Repository Layer**
   - `backend/app/repositories/auth_repository.py` - Data access layer

8. **Dependencies**
   - `backend/app/core/dependencies.py` - Dependency injection (get_current_user, dll)

9. **Exceptions**
   - `backend/app/core/exceptions.py` - Custom exception classes

### Frontend Files (Urutan Eksekusi)

1. **Pages**
   - `frontend/src/app/(auth)/login/page.tsx` - Login page
   - `frontend/src/app/(auth)/register/page.tsx` - Register page
   - `frontend/src/app/(auth)/callback/page.tsx` - OAuth callback handler
   - `frontend/src/app/(auth)/forgot-password/page.tsx` - Forgot password page
   - `frontend/src/app/(auth)/reset-password/page.tsx` - Reset password page

2. **Components**
   - `frontend/src/features/auth/components/LoginForm.tsx` - Login form component
   - `frontend/src/features/auth/components/RegisterForm.tsx` - Register form component
   - `frontend/src/features/auth/components/ForgotPasswordForm.tsx` - Forgot password form

3. **API Client**
   - `frontend/src/features/auth/api/authApi.ts` - API calls ke backend

4. **State Management**
   - `frontend/src/features/auth/store.ts` - Zustand store untuk auth state
   - `frontend/src/features/auth/types.ts` - TypeScript types

5. **Validation**
   - `frontend/src/features/auth/validations/authSchema.ts` - Zod schemas

6. **Hooks**
   - `frontend/src/features/auth/hooks/useLogin.ts` - Login hook
   - `frontend/src/features/auth/hooks/useAuth.ts` - Auth utilities hook

7. **Supabase Client**
   - `frontend/src/lib/supabase.ts` - Supabase client configuration

---

## 🔒 Security Features

### Backend Security
1. **JWT Verification**
   - Signature verification dengan SUPABASE_JWT_SECRET
   - Expiration check
   - Audience validation

2. **Password Validation**
   - Min 8 characters
   - Uppercase, lowercase, digit, special char required
   - Max 128 characters

3. **Email Validation**
   - Email format check
   - Lowercase & trim
   - Max 254 characters
   - Suspicious pattern detection

4. **CORS Protection**
   - Whitelist allowed origins
   - No wildcard in production

5. **Error Handling**
   - Generic error messages (security by obscurity)
   - Proper HTTP status codes
   - Exception handlers

### Frontend Security
1. **Token Storage**
   - localStorage dengan encryption (Zustand persist)
   - Auto-clear on logout

2. **Token Refresh**
   - Auto-refresh sebelum expire
   - Fallback ke login jika gagal

3. **HTTPS Only**
   - All API calls via HTTPS
   - Secure cookie flags

4. **Input Validation**
   - Client-side validation dengan Zod
   - Server-side validation dengan Pydantic

---

## 🎯 Best Practices

1. **Separation of Concerns**
   - API → Service → Repository pattern
   - Clear responsibility per layer

2. **Error Handling**
   - Custom exception classes
   - Centralized error handlers
   - User-friendly error messages

3. **Type Safety**
   - TypeScript di frontend
   - Pydantic di backend
   - Shared types/models

4. **State Management**
   - Zustand untuk global state
   - Persist ke localStorage
   - Hydration handling

5. **Token Management**
   - Auto-refresh mechanism
   - Expiry checking
   - Secure storage

6. **Testing**
   - Unit tests untuk services
   - Integration tests untuk repositories
   - E2E tests untuk flows

---

## 📊 Diagram Alur

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. User Input (email, password)
       ↓
┌─────────────────────────────┐
│  LoginForm Component        │
│  - Validation (Zod)         │
│  - Form handling (RHF)      │
└──────┬──────────────────────┘
       │
       │ 2. login(email, password)
       ↓
┌─────────────────────────────┐
│  authApi.ts                 │
│  - POST /api/auth/login     │
└──────┬──────────────────────┘
       │
       │ 3. HTTP Request
       ↓
┌─────────────────────────────┐
│  Backend: auth.py           │
│  - Endpoint handler         │
└──────┬──────────────────────┘
       │
       │ 4. service.login()
       ↓
┌─────────────────────────────┐
│  auth_service.py            │
│  - Business logic           │
└──────┬──────────────────────┘
       │
       │ 5. auth_repo.login()
       ↓
┌─────────────────────────────┐
│  auth_repository.py         │
│  - Data access              │
└──────┬──────────────────────┘
       │
       │ 6. supabase.auth.sign_in_with_password()
       ↓
┌─────────────────────────────┐
│  Supabase                   │
│  - Authenticate             │
│  - Generate tokens          │
└──────┬──────────────────────┘
       │
       │ 7. Return tokens
       ↓
┌─────────────────────────────┐
│  Backend Response           │
│  - TokenOut                 │
└──────┬──────────────────────┘
       │
       │ 8. Store tokens
       ↓
┌─────────────────────────────┐
│  useAuthStore (Zustand)     │
│  - setAuth()                │
│  - Persist to localStorage  │
└──────┬──────────────────────┘
       │
       │ 9. Redirect
       ↓
┌─────────────────────────────┐
│  /dashboard                 │
│  - Protected route          │
└─────────────────────────────┘
```

---

## 🚀 Quick Reference

### Environment Variables

**Backend (.env)**
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:3001
ALLOWED_ORIGINS=["http://localhost:3001"]
```

**Frontend (.env)**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login with email/password |
| POST | `/api/auth/logout` | ✅ | Logout current user |
| POST | `/api/auth/refresh` | ❌ | Refresh access token |
| POST | `/api/auth/forgot-password` | ❌ | Request password reset |
| GET | `/api/auth/verify` | ✅ | Verify token validity |
| GET | `/api/auth/google` | ❌ | Get Google OAuth URL |

### Token Lifetimes

- **Access Token**: 1 hour (3600 seconds)
- **Refresh Token**: 7 days
- **Auto-refresh**: 5 minutes before expiry

---

**Dokumentasi dibuat pada**: 15 Maret 2026
**Versi**: 1.0.0
**Author**: AI Assistant
