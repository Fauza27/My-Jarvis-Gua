# Panduan Lengkap Authentication System

## Daftar Isi

1. [Pengenalan](#pengenalan)
2. [Arsitektur Authentication](#arsitektur-authentication)
3. [Masalah yang Ditemukan & Solusi](#masalah-yang-ditemukan--solusi)
4. [Konfigurasi Supabase](#konfigurasi-supabase)
5. [Implementasi Backend](#implementasi-backend)
6. [Implementasi Frontend](#implementasi-frontend)
7. [Flow Authentication](#flow-authentication)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)
10. [Security Best Practices](#security-best-practices)

---

## Pengenalan

Aplikasi ini menggunakan **Supabase Auth** untuk authentication dengan dua metode:
- **Email/Password**: Register dan login dengan email
- **OAuth (Google)**: Login dengan akun Google

### Prinsip Desain

1. **Backend-First**: Semua logic authentication ada di backend
2. **Token Verification**: Backend verify semua token sebelum accept
3. **Dual Flow Support**: Support implicit flow (email) dan PKCE flow (OAuth)
4. **Security**: HTTPS, token expiration, refresh token rotation

---

## Arsitektur Authentication

### Stack Teknologi

**Backend**:
- FastAPI (Python)
- Supabase Python Client
- PostgreSQL (via Supabase)

**Frontend**:
- Next.js 16 (React)
- Supabase JavaScript Client
- Zustand (state management)

### Flow Diagram

```
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└──────┬──────┘
       │
       │ 1. User Action
       │
       ▼
┌─────────────────┐
│  Supabase Auth  │
│   (OAuth/Email) │
└──────┬──────────┘
       │
       │ 2. Tokens
       │
       ▼
┌─────────────┐
│   Backend   │
│  (FastAPI)  │
└──────┬──────┘
       │
       │ 3. Verify Token
       │
       ▼
┌─────────────┐
│  Dashboard  │
└─────────────┘
```

---

## Masalah yang Ditemukan & Solusi

### Masalah 1: Register/Login Redirect ke Callback Gagal

**Gejala**:
```
User register → Email confirmation → Klik link → 
Redirect ke /callback?code=xxx → Gagal
```

**Root Cause**:
- Callback page hanya handle PKCE flow
- Email confirmation menggunakan implicit flow
- Tidak ada handler untuk implicit flow

**Solusi**:
Handle kedua flow (PKCE dan implicit) di callback page.

### Masalah 2: OAuth Error "code verifier should be non-empty"

**Gejala**:
```
AuthApiError: invalid request: both auth code and code verifier should be non-empty
```

**Root Cause**:
- OAuth flow dimulai dari backend
- PKCE memerlukan `code_verifier` yang dibuat saat flow dimulai
- Karena flow dimulai dari backend, `code_verifier` tidak ada di frontend

**Solusi**:
Initiate OAuth dari frontend menggunakan Supabase client.

---

## Konfigurasi Supabase

### 1. Dapatkan Credentials

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Pergi ke **Settings** → **API**
4. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Key untuk client-side
   - **service_role key**: Key untuk server-side (RAHASIA!)
5. Pergi ke **Settings** → **API** → **JWT Settings**
   - Copy **JWT Secret**: Untuk verifikasi token

### 2. Konfigurasi URL Redirect

1. Pergi ke **Authentication** → **URL Configuration**
2. Set **Site URL**:
   - Development: `http://localhost:3001`
   - Production: `https://yourdomain.com`
3. Tambahkan **Redirect URLs**:
   ```
   http://localhost:3001/callback
   http://localhost:3000/callback
   https://yourdomain.com/callback
   ```

### 3. Konfigurasi Email Provider

#### Development (Built-in Email)

1. Pergi ke **Authentication** → **Providers** → **Email**
2. Enable **Email provider**
3. **Confirm email**:
   - Enable untuk production
   - Disable untuk development (langsung bisa login)

#### Production (Custom SMTP)

1. Pergi ke **Project Settings** → **Auth** → **SMTP Settings**
2. Enable **Enable Custom SMTP**
3. Isi konfigurasi SMTP:
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: your-email@gmail.com
   Password: your-app-password
   Sender email: your-email@gmail.com
   Sender name: Your App Name
   ```

### 4. Konfigurasi Email Templates

1. Pergi ke **Authentication** → **Email Templates**
2. Edit template **Confirm signup**:

```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your email:</p>
<p><a href="{{ .RedirectTo }}">Confirm your email</a></p>
```

3. Edit template **Reset Password**:

```html
<h2>Reset Password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .RedirectTo }}">Reset password</a></p>
```

**PENTING**: Gunakan `{{ .RedirectTo }}` bukan `{{ .SiteURL }}`!

### 5. Konfigurasi Google OAuth

#### A. Setup Google Cloud Console

1. Pergi ke [Google Cloud Console](https://console.cloud.google.com)
2. Buat project baru atau pilih existing
3. Enable **Google+ API**
4. Buat OAuth 2.0 Credentials:
   - Application type: **Web application**
   - Name: `My Jarvis Gua`
5. Tambahkan **Authorized redirect URIs**:
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   ```
6. Copy **Client ID** dan **Client Secret**

#### B. Setup di Supabase

1. Pergi ke **Authentication** → **Providers**
2. Cari **Google** dan enable
3. Paste **Client ID** dan **Client Secret**
4. Klik **Save**

### 6. Setup Environment Variables

#### Backend `.env`

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-here

# Testing (optional)
SUPABASE_TEST_URL=https://xxxxx.supabase.co
SUPABASE_TEST_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_TEST_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App
ENVIRONMENT=development
FRONTEND_URL=http://localhost:3001

# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

#### Frontend `.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 7. Jalankan Database Migration

```bash
cd backend
psql -h db.xxxxx.supabase.co -U postgres -d postgres -f schema.sql
```

Atau copy-paste isi `schema.sql` ke **SQL Editor** di Supabase Dashboard.

---

## Implementasi Backend

### Struktur File

```
backend/app/
├── api/
│   └── auth.py              # API endpoints
├── services/
│   └── auth_service.py      # Business logic
├── repositories/
│   └── auth_repository.py   # Database operations
├── models/
│   └── auth.py              # Pydantic models
└── core/
    ├── config.py            # Configuration
    ├── dependencies.py      # Dependencies
    └── exceptions.py        # Custom exceptions
```

### API Endpoints

#### 1. Register (`POST /api/auth/register`)

```python
@router.post("/register", response_model=MessageOut, status_code=201)
async def register(
    body: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
):
    settings = get_settings()
    return service.register(
        email=body.email,
        password=body.password,
        redirect_url=settings.auth_redirect_url,
    )
```

**Request**:
```json
{
  "email": "user@example.com",
  "password": "Password123!@#"
}
```

**Response**:
```json
{
  "message": "Registration successful. Please check your email to confirm."
}
```

#### 2. Login (`POST /api/auth/login`)

```python
@router.post("/login", response_model=TokenOut)
async def login(
    body: LoginRequest,
    service: AuthService = Depends(get_auth_service),
):
    return service.login(email=body.email, password=body.password)
```

**Request**:
```json
{
  "email": "user@example.com",
  "password": "Password123!@#"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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

#### 3. Verify Token (`GET /api/auth/verify`)

```python
@router.get("/verify")
async def verify_token(current_user: CurrentUser):
    return {
        "valid": True,
        "user_id": str(current_user.id),
        "email": current_user.email,
    }
```

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**:
```json
{
  "valid": true,
  "user_id": "uuid",
  "email": "user@example.com"
}
```

#### 4. Refresh Token (`POST /api/auth/refresh`)

```python
@router.post("/refresh", response_model=TokenOut)
async def refresh_token(
    body: RefreshTokenRequest,
    service: AuthService = Depends(get_auth_service),
):
    return service.refresh_session(refresh_token=body.refresh_token)
```

#### 5. Logout (`POST /api/auth/logout`)

```python
@router.post("/logout", response_model=MessageOut)
async def logout(
    _current_user: CurrentUser,
    service: AuthService = Depends(get_auth_service),
):
    return service.logout()
```

#### 6. Forgot Password (`POST /api/auth/forgot-password`)

```python
@router.post("/forgot-password", response_model=MessageOut)
async def forgot_password(
    body: ResetPasswordRequest,
    service: AuthService = Depends(get_auth_service),
):
    settings = get_settings()
    return service.request_password_reset(
        email=body.email,
        redirect_url=settings.password_reset_url,
    )
```

### Service Layer

```python
class AuthService:
    def __init__(self, auth_repo: AuthRepository):
        self._auth_repo = auth_repo
    
    def register(self, email: str, password: str, redirect_url: str) -> MessageOut:
        """Register a new user and send confirmation email."""
        self._auth_repo.register(email, password, redirect_url)
        return MessageOut(message="Registration successful. Please check your email to confirm.")
    
    def login(self, email: str, password: str) -> TokenOut:
        """Login user and return access and refresh tokens."""
        response = self._auth_repo.login(email, password)
        session = response.session
        user = response.user
        
        return TokenOut(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            expires_at=session.expires_at,
            user=UserOut(
                id=str(user.id),
                email=user.email,
                created_at=str(user.created_at),
                email_confirmed=getattr(user, 'email_confirmed_at', None) is not None,
            )
        )
```

### Repository Layer

```python
class AuthRepository:
    def __init__(self, client: Client):
        self._client = client
    
    def register(self, email: str, password: str, redirect_url: str) -> object:
        """Register a new user with email and password."""
        try:
            response = self._client.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "emailRedirectTo": redirect_url
                }
            })
            return response
        except AuthApiError as e:
            error_msg = str(e.message).lower()
            if "already registered" in error_msg:
                raise UserAlreadyExistsError("User with this email already exists.")
            raise AuthenticationError(f"Failed to register user: {e.message}")
    
    def login(self, email: str, password: str) -> object:
        """Login user with email and password."""
        try:
            response = self._client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            return response
        except AuthApiError as e:
            error_msg = str(e.message).lower()
            if "email not confirmed" in error_msg:
                raise EmailNotConfirmedError("Email not confirmed. Please check your inbox.")
            raise AuthenticationError("Invalid email or password.")
```

---

## Implementasi Frontend

### Struktur File

```
frontend/src/
├── app/
│   └── (auth)/
│       ├── login/page.tsx
│       ├── register/page.tsx
│       └── callback/page.tsx
├── features/auth/
│   ├── api/authApi.ts
│   ├── store.ts
│   ├── components/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   └── types.ts
└── lib/
    └── supabase.ts
```

### Supabase Client Configuration

```typescript
// frontend/src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,  // Auto-detect session from URL
    persistSession: true,      // Persist in localStorage
  },
});
```

### Auth Store (Zustand)

```typescript
// frontend/src/features/auth/store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  setAuth: (accessToken: string, refreshToken: string, expiresAt: number, user: User) => void;
  clearAuth: () => void;
  isTokenExpired: () => boolean;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
      
      setAuth: (accessToken, refreshToken, expiresAt, user) => {
        set({
          accessToken,
          refreshToken,
          expiresAt,
          user,
          isAuthenticated: true,
        });
      },
      
      clearAuth: () => set({
        user: null,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        isAuthenticated: false,
      }),
      
      isTokenExpired: () => {
        const state = get();
        if (!state.expiresAt) return true;
        return Math.floor(Date.now() / 1000) >= state.expiresAt;
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### Login Page

```typescript
// frontend/src/app/(auth)/login/page.tsx
const handleGoogleLogin = async () => {
  const { supabase } = await import("@/lib/supabase");
  
  // Initiate OAuth from frontend
  // This creates and stores code_verifier in localStorage
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/callback`,
    },
  });
};
```

### Callback Page

```typescript
// frontend/src/app/(auth)/callback/page.tsx
const handleCallback = async () => {
  const { supabase } = await import("@/lib/supabase");
  const code = searchParams.get("code");
  
  if (code) {
    // PKCE flow (OAuth)
    const { data } = await supabase.auth.exchangeCodeForSession(
      window.location.search
    );
    
    // Verify with backend
    const userData = await verifyToken(data.session.access_token);
    
    // Store tokens
    setAuth(
      data.session.access_token,
      data.session.refresh_token,
      data.session.expires_at,
      userData
    );
    
    router.push("/dashboard");
  } else {
    // Implicit flow (Email)
    const { data: { session } } = await supabase.auth.getSession();
    
    // Verify with backend
    const userData = await verifyToken(session.access_token);
    
    // Store tokens
    setAuth(
      session.access_token,
      session.refresh_token,
      session.expires_at,
      userData
    );
    
    router.push("/dashboard");
  }
};
```

---

## Flow Authentication

### 1. Email Register Flow (Implicit)

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Submit form (email, password)
     ▼
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ 2. POST /api/auth/register
       ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │ 3. sign_up()
       ▼
┌─────────────┐
│  Supabase   │
└──────┬──────┘
       │ 4. Send email confirmation
       ▼
┌─────────────┐
│    Email    │
└──────┬──────┘
       │ 5. User click link
       ▼
┌─────────────────────────────────────┐
│  /callback#access_token=xxx         │
│  (Hash fragment - Implicit flow)    │
└──────┬──────────────────────────────┘
       │ 6. Supabase client auto-detect
       ▼
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ 7. getSession()
       │ 8. verifyToken() → Backend
       │ 9. Store tokens
       ▼
┌─────────────┐
│  Dashboard  │
└─────────────┘
```

### 2. Email Login Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Submit form (email, password)
     ▼
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ 2. POST /api/auth/login
       ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │ 3. sign_in_with_password()
       ▼
┌─────────────┐
│  Supabase   │
└──────┬──────┘
       │ 4. Return tokens
       ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │ 5. Return TokenOut
       ▼
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ 6. Store tokens
       ▼
┌─────────────┐
│  Dashboard  │
└─────────────┘
```

### 3. OAuth Flow (PKCE)

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Click "Login with Google"
     ▼
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ 2. signInWithOAuth()
       │    - Create code_verifier
       │    - Store in localStorage
       ▼
┌─────────────┐
│   Google    │
└──────┬──────┘
       │ 3. User authorize
       ▼
┌─────────────┐
│  Supabase   │
└──────┬──────┘
       │ 4. Redirect with code
       ▼
┌─────────────────────────────────────┐
│  /callback?code=xxx                 │
│  (Query parameter - PKCE flow)      │
└──────┬──────────────────────────────┘
       │ 5. exchangeCodeForSession()
       │    - Get code_verifier from localStorage
       │    - Exchange code + verifier
       ▼
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ 6. verifyToken() → Backend
       │ 7. Store tokens
       ▼
┌─────────────┐
│  Dashboard  │
└─────────────┘
```

---

## Testing

### Setup

```bash
# Terminal 1 - Backend
cd backend
python app/main.py

# Terminal 2 - Frontend
cd frontend
pnpm run dev
```

### Test Cases

#### 1. Email Register

```bash
# Manual test
1. Buka http://localhost:3001/register
2. Isi form:
   - Email: test@example.com
   - Password: Test123!@#
3. Submit
4. Cek inbox email
5. Klik link konfirmasi
6. Harus redirect ke dashboard

# API test
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

#### 2. Email Login

```bash
# Manual test
1. Buka http://localhost:3001/login
2. Isi form dengan email/password yang sudah register
3. Submit
4. Harus redirect ke dashboard

# API test
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

#### 3. Google OAuth

```bash
# Manual test
1. Buka http://localhost:3001/login
2. Klik "Login with Google"
3. Authorize di Google
4. Harus redirect ke dashboard
```

#### 4. Token Verification

```bash
curl -X GET http://localhost:8000/api/auth/verify \
  -H "Authorization: Bearer <access_token>"
```

#### 5. Refresh Token

```bash
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<refresh_token>"
  }'
```

---

## Troubleshooting

### Error: "No authorization code found"

**Penyebab**: Supabase tidak mengirim code parameter ke callback URL

**Solusi**:
1. Cek Redirect URLs di Supabase Dashboard
2. Pastikan `http://localhost:3001/callback` ada di list
3. Cek email templates menggunakan `{{ .RedirectTo }}`

### Error: "Failed to exchange code for session"

**Penyebab**: Code sudah expired atau invalid

**Solusi**:
1. Code hanya valid 1x dan expire dalam 5 menit
2. Jangan refresh halaman callback
3. Coba login ulang

### Error: "Email not confirmed"

**Penyebab**: User belum klik confirmation link

**Solusi**:
1. Cek inbox email (dan spam folder)
2. Atau disable email confirmation untuk development:
   - Supabase Dashboard → Authentication → Providers → Email
   - Uncheck "Confirm email"

### Error: "Invalid JWT Secret"

**Penyebab**: JWT Secret salah atau tidak diset

**Solusi**:
1. Copy JWT Secret dari Supabase Dashboard → Settings → API
2. Paste ke `SUPABASE_JWT_SECRET` di backend `.env`
3. Restart backend

### Error: "Token verification failed"

**Penyebab**: Token invalid atau expired

**Solusi**:
1. Cek token masih valid (belum expire)
2. Cek `SUPABASE_JWT_SECRET` di backend benar
3. Coba refresh token atau login ulang

### Error: "CORS error"

**Penyebab**: Frontend URL tidak ada di CORS whitelist

**Solusi**:
1. Cek `ALLOWED_ORIGINS` di backend `config.py`
2. Tambahkan `http://localhost:3001` ke list
3. Restart backend

---

## Security Best Practices

### 1. Environment Variables

✅ **DO**:
- Simpan credentials di `.env` file
- Tambahkan `.env` ke `.gitignore`
- Gunakan `.env.example` sebagai template

❌ **DON'T**:
- Commit `.env` ke git
- Hardcode credentials di code
- Share credentials di public

### 2. Token Management

✅ **DO**:
- Store tokens di localStorage (untuk SPA)
- Implement token refresh sebelum expire
- Clear tokens saat logout

❌ **DON'T**:
- Store tokens di cookies (untuk SPA)
- Expose tokens di URL
- Share tokens antar users

### 3. Password Requirements

✅ **DO**:
- Minimum 8 characters
- Require uppercase, lowercase, number, special char
- Validate di frontend dan backend

❌ **DON'T**:
- Allow weak passwords
- Store plain text passwords
- Log passwords

### 4. API Security

✅ **DO**:
- Verify token di backend untuk setiap request
- Use HTTPS di production
- Implement rate limiting
- Validate input di backend

❌ **DON'T**:
- Trust frontend validation only
- Expose sensitive data di API response
- Allow unlimited requests

### 5. Production Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` tidak di-commit ke git
- [ ] `SUPABASE_JWT_SECRET` tidak di-commit ke git
- [ ] Email confirmation enabled
- [ ] HTTPS enabled
- [ ] CORS configured dengan domain spesifik (bukan wildcard)
- [ ] Rate limiting enabled
- [ ] Custom SMTP configured
- [ ] Error messages tidak expose sensitive info
- [ ] Logging tidak log passwords/tokens

---

## Referensi

### Dokumentasi Supabase

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [OAuth with Supabase](https://supabase.com/docs/guides/auth/social-login)
- [PKCE Flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
- [Implicit Flow](https://supabase.com/docs/guides/auth/sessions/implicit-flow)
- [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

### OAuth 2.0

- [OAuth 2.0 PKCE](https://oauth.net/2/pkce/)
- [OAuth 2.0 Implicit Grant](https://oauth.net/2/grant-types/implicit/)

### FastAPI

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)

### Next.js

- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## Kesimpulan

Authentication system ini menggunakan:

1. **Dual Flow Support**:
   - Implicit flow untuk email/password
   - PKCE flow untuk OAuth

2. **Backend-First Architecture**:
   - Semua logic di backend
   - Frontend hanya call API
   - Backend verify semua token

3. **Security**:
   - HTTPS encryption
   - Token verification
   - Password requirements
   - Rate limiting

4. **User Experience**:
   - Email confirmation
   - OAuth (Google)
   - Auto token refresh
   - Error handling

Dengan implementasi ini, authentication system aman, scalable, dan mudah di-maintain.
