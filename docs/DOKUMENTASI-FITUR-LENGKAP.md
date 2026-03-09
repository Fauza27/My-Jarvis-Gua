# Dokumentasi Fitur My Jarvis Gua - Panduan Lengkap untuk Developer

> **Catatan untuk Pembaca**: Dokumentasi ini ditulis dengan gaya naratif seperti mentor yang sedang menjelaskan ke mentee. Bukan textbook kaku, tapi ngobrol santai sambil pair programming. ☕

---

## Daftar Isi

1. [Arsitektur Sistem](#arsitektur-sistem)
2. [Fitur Autentikasi](#fitur-autentikasi)
3. [Manajemen State & Token](#manajemen-state--token)
4. [Integrasi Frontend-Backend](#integrasi-frontend-backend)

---

## Arsitektur Sistem

### Apa

Bayangin kamu lagi bangun rumah. Nah, arsitektur sistem ini kayak blueprint rumahnya. My Jarvis Gua dibangun dengan arsitektur **monorepo** yang terdiri dari:

- **Backend**: FastAPI (Python) - ini kayak dapur rumah, tempat semua masakan (logic bisnis) diproses
- **Frontend**: Next.js 16 (React) - ini kayak ruang tamu, tempat tamu (user) berinteraksi
- **Database**: Supabase (PostgreSQL) - ini kayak gudang, tempat semua barang (data) disimpan

### Kenapa

Kenapa pakai arsitektur terpisah gini? Bayangin kalau semua jadi satu file besar. Mau cari bug? Susah. Mau scale? Ribet. Mau kerja bareng tim? Chaos.

Dengan memisahkan frontend dan backend:
- Frontend bisa di-deploy ke Vercel
- Backend bisa di-deploy ke Railway/Render
- Kalau frontend error, backend tetap jalan (dan sebaliknya)
- Tim frontend dan backend bisa kerja paralel tanpa injak-injak kaki

### Bagaimana

Struktur folder kita seperti ini:

```
life-os/
├── backend/          # FastAPI application
│   ├── app/
│   │   ├── api/      # HTTP endpoints (routes)
│   │   ├── services/ # Business logic
│   │   ├── repositories/ # Database operations
│   │   ├── models/   # Pydantic schemas
│   │   ├── core/     # Config, dependencies, exceptions
│   │   └── infrastructure/ # External services (Supabase)
│   └── tests/        # Unit & integration tests
│
├── frontend/         # Next.js application
│   └── src/
│       ├── app/      # Next.js App Router (pages)
│       ├── features/ # Feature-based modules
│       ├── lib/      # Shared utilities
│       └── providers/ # React context providers
│
└── docs/            # Documentation
```

### Kode & Penjelasan

Mari kita lihat entry point backend di `backend/app/main.py`:

```python
import sys
from pathlib import Path

# Add parent directory (backend) to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.core.application:create_app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        factory=True,
        reload_dirs=[str(backend_dir / "app")],
    )
```

**Penjelasan baris per baris:**

1. `sys.path.insert(0, str(backend_dir))` - Ini kayak ngasih tau Python, "Eh, kalau ada import `app.something`, cari di folder backend ya". Tanpa ini, Python bakal bingung.

2. `uvicorn.run(...)` - Uvicorn itu web server ASGI. Bayangin kayak pelayan restoran yang nerima pesanan (HTTP request) dan ngasih makanan (HTTP response).

3. `factory=True` - Ini penting! Artinya kita pakai factory pattern. Setiap kali server restart, dia bikin aplikasi baru dari nol. Kenapa? Biar clean, nggak ada "sampah" dari session sebelumnya.

4. `reload=True` - Auto-reload kalau ada perubahan kode. Ini lifesaver pas development!

### Kenapa Ini Benar

Factory pattern (`factory=True`) adalah best practice karena:
- Memastikan setiap instance aplikasi punya state yang bersih
- Memudahkan testing (bisa bikin multiple instance dengan config berbeda)
- Mencegah memory leak dari global state

### Jebakan Pemula

**Jebakan #1**: Lupa set `sys.path`, terus import error everywhere.
```python
# ❌ SALAH - Import bakal gagal
from app.core.config import get_settings

# ✅ BENAR - Setelah set sys.path
sys.path.insert(0, str(backend_dir))
from app.core.config import get_settings
```

**Jebakan #2**: Pakai `reload=False` pas development. Setiap ubah kode harus restart manual. Capek!

**Jebakan #3**: Hardcode `port=8000` di production. Nanti pas deploy ke cloud, port-nya bisa beda. Solusi:
```python
port = int(os.getenv("PORT", 8000))  # Ambil dari environment variable
```

---


## Fitur Autentikasi

### Apa

Autentikasi adalah sistem yang memastikan "kamu adalah kamu". Kayak satpam di mall yang cek KTP sebelum masuk. Di My Jarvis Gua, kita punya fitur autentikasi lengkap:

- **Register** - Daftar akun baru
- **Login** - Masuk dengan email & password
- **Logout** - Keluar dari sistem
- **Forgot Password** - Lupa password? Tenang, bisa reset
- **Email Verification** - Verifikasi email setelah register
- **OAuth Google** - Login pakai akun Google
- **Token Refresh** - Auto-refresh token sebelum expired

### Kenapa

Bayangin kalau aplikasi kita nggak ada autentikasi. Semua orang bisa akses data siapa aja. Chaos! Data pribadi bocor, privacy hilang, trust user ilang.

Dengan autentikasi yang proper:
- User data aman (hanya pemilik yang bisa akses)
- Bisa tracking siapa yang ngapain (audit trail)
- Bisa kasih akses berbeda per user (authorization)
- Compliance dengan regulasi (GDPR, dll)

### Bagaimana

Flow autentikasi kita mengikuti pola standar industri:

**Flow Register:**
1. User isi email & password di frontend
2. Frontend validasi input (format email, password strength)
3. Kirim ke backend `/api/auth/register`
4. Backend validasi lagi (double check!)
5. Backend bikin user di Supabase
6. Supabase kirim email verifikasi
7. User klik link di email
8. Redirect ke frontend `/callback`
9. Frontend simpan token & redirect ke dashboard

**Flow Login:**
1. User isi email & password
2. Frontend kirim ke `/api/auth/login`
3. Backend cek ke Supabase
4. Kalau valid, Supabase return access_token & refresh_token
5. Frontend simpan token di localStorage (via Zustand)
6. Redirect ke dashboard

**Flow Token Refresh:**
1. Setiap request, frontend cek: "Token masih valid?"
2. Kalau mau expired (< 5 menit), auto-refresh
3. Pakai refresh_token untuk dapetin access_token baru
4. Update localStorage dengan token baru
5. Lanjut request dengan token baru

### Kode & Penjelasan

#### Backend: Auth Repository Layer

File: `backend/app/repositories/auth_repository.py`

```python
class AuthRepository:
    def __init__(self, client: Client):
        self._client = client
    
    def register(self, email: str, password: str, redirect_url: str) -> object:
        """Register a new user with email and password."""
        try:
            response = self._client.auth.sign_up(
                {
                    "email": email,
                    "password": password,
                    "options": {
                        "emailRedirectTo": redirect_url
                    }
                }
            )
            return response
        except AuthApiError as e:
            error_msg = str(e.message).lower()
            if "already registered" in error_msg or "alredy registered" in error_msg:
                raise UserAlreadyExistsError("User with this email already exists.")
            raise AuthenticationError(f"Failed to register user: {e.message}")
```

**Penjelasan:**

1. **Repository Pattern** - Ini pattern yang memisahkan logic database dari business logic. Bayangin repository kayak kasir di toko. Dia yang ngurus transaksi dengan "bank" (database). Business logic (service layer) tinggal bilang "tolong ambil data user X", nggak perlu tau gimana cara ambilnya.

2. **`emailRedirectTo`** - Ini URL yang bakal dikunjungi user setelah klik link verifikasi di email. Penting banget! Kalau salah, user bakal redirect ke 404.

3. **Error Handling** - Perhatikan kita catch `AuthApiError` dari Supabase, terus convert jadi custom exception kita (`UserAlreadyExistsError`). Kenapa? Biar frontend nggak perlu tau detail error dari Supabase. Abstraction!

4. **Typo Handling** - Lihat `"alredy registered"` (typo)? Ini real case! Supabase pernah typo di error message mereka. Kita handle both cases biar robust.

#### Backend: Auth Service Layer

File: `backend/app/services/auth_service.py`

```python
class AuthService:
    def __init__(self, auth_repo: AuthRepository):
        self._auth_repo = auth_repo
    
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

**Penjelasan:**

1. **Service Layer** - Ini tempat business logic. Dia orchestrate (mengatur) flow. Ambil data dari repository, transform kalau perlu, return ke API layer.

2. **Data Transformation** - Perhatikan kita convert response dari Supabase jadi `TokenOut` (Pydantic model). Kenapa? Biar frontend selalu dapet format yang konsisten. Kalau Supabase ubah format response, kita tinggal ubah di sini aja.

3. **`getattr(user, 'email_confirmed_at', None)`** - Ini defensive programming. Kadang field `email_confirmed_at` nggak ada (tergantung Supabase version). Daripada error, kita kasih default `None`.

#### Backend: Auth API Endpoints

File: `backend/app/api/auth.py`

```python
@router.post(
    "/register",
    response_model=MessageOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
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

**Penjelasan:**

1. **Dependency Injection** - `Depends(get_auth_service)` ini magic dari FastAPI. Dia auto-create `AuthService` instance untuk kita. Nggak perlu manual `service = AuthService(...)`. Clean!

2. **`response_model=MessageOut`** - Ini contract dengan frontend. "Gue bakal return object dengan struktur MessageOut". FastAPI auto-validate response kita. Kalau nggak sesuai, error!

3. **`status_code=status.HTTP_201_CREATED`** - 201 artinya "Created". Ini HTTP standard. 200 = OK, 201 = Created, 400 = Bad Request, 401 = Unauthorized, dst.

4. **`settings.auth_redirect_url`** - Ambil dari config. Jangan hardcode! Biar bisa beda per environment (dev, staging, prod).

#### Backend: Password Validation

File: `backend/app/models/auth.py`

```python
class RegisterRequest(BaseModel):
    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if len(value) > 128:
            raise ValueError("Password too long (max 128 characters)")
        
        errors = []
        if len(value) < 8:
            errors.append("minimum 8 characters")
        if not any(c.isupper() for c in value):
            errors.append("minimum 1 uppercase letter")
        if not any(c.islower() for c in value):
            errors.append("minimum 1 lowercase letter")
        if not any(c.isdigit() for c in value):
            errors.append("minimum 1 digit")
        if not any(c in "!@#$%^&*(),.?\":{}|<>" for c in value):
            errors.append("minimum 1 special character")

        if errors:
            raise ValueError(f"Password must contain: {', '.join(errors)}")
        
        return value
```

**Penjelasan:**

1. **Pydantic Validation** - Ini auto-validation dari Pydantic. Sebelum masuk ke service layer, data udah di-validate. Kalau nggak valid, auto-return 422 error ke frontend.

2. **Password Strength** - Kita enforce password yang kuat: min 8 karakter, ada uppercase, lowercase, angka, dan special character. Ini best practice security.

3. **Max Length 128** - Kenapa ada max? Biar nggak ada orang iseng kirim password 1 juta karakter yang bikin server hang.

4. **Custom Error Message** - Error message kita jelas: "Password must contain: minimum 8 characters, minimum 1 uppercase letter". User langsung tau apa yang salah.

### Kenapa Ini Benar

**1. Layered Architecture (Repository → Service → API)**

Ini separation of concerns. Setiap layer punya tanggung jawab jelas:
- Repository: Ngurus database
- Service: Business logic
- API: HTTP handling

Keuntungan:
- Mudah testing (bisa mock repository pas test service)
- Mudah ganti database (tinggal ganti repository layer)
- Code reusability (service bisa dipanggil dari API, background job, dll)

**2. Dependency Injection**

Daripada hardcode dependency:
```python
# ❌ SALAH - Hardcoded
def register():
    supabase = create_client(...)
    repo = AuthRepository(supabase)
    service = AuthService(repo)
```

Kita pakai DI:
```python
# ✅ BENAR - Dependency Injection
async def register(service: AuthService = Depends(get_auth_service)):
    ...
```

Keuntungan:
- Mudah testing (bisa inject mock service)
- Loose coupling (API layer nggak perlu tau gimana cara bikin service)
- Single source of truth (kalau mau ubah cara bikin service, ubah di `get_auth_service` aja)

**3. Pydantic Validation**

Validasi di backend adalah WAJIB. Jangan percaya frontend! Frontend bisa di-bypass pakai Postman/curl.

```python
# ✅ BENAR - Validasi di backend
class RegisterRequest(BaseModel):
    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=8, max_length=128)
```

### Jebakan Pemula

**Jebakan #1: Nggak Validasi di Backend**

"Ah, udah validasi di frontend kok, nggak perlu di backend."

❌ SALAH! Frontend bisa di-bypass. Hacker bisa langsung hit API pakai curl:
```bash
curl -X POST http://api.com/register -d '{"email":"hack","password":"x"}'
```

Kalau nggak ada validasi backend, data sampah masuk database!

**Jebakan #2: Simpan Password Plain Text**

```python
# ❌ BAHAYA! Jangan simpan password plain text
user.password = "Password123!"
```

Supabase udah auto-hash password kita. Tapi kalau pakai database lain, WAJIB hash pakai bcrypt/argon2:
```python
# ✅ BENAR
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed = pwd_context.hash(password)
```

**Jebakan #3: Nggak Handle Token Expiry**

Token JWT punya expiry time. Kalau nggak di-handle, user tiba-tiba logout sendiri (bad UX).

Solusi: Auto-refresh token sebelum expired (kita bahas di section berikutnya).

**Jebakan #4: Hardcode Redirect URL**

```python
# ❌ SALAH
redirect_url = "http://localhost:3001/callback"
```

Pas deploy ke production, URL-nya beda! Solusi:
```python
# ✅ BENAR
redirect_url = settings.auth_redirect_url  # Ambil dari environment variable
```

---


## Frontend: Implementasi Autentikasi

### Apa

Di sisi frontend, kita punya komponen-komponen React yang handle user interaction untuk autentikasi. Ini kayak "wajah" dari sistem autentikasi kita - yang dilihat dan disentuh user.

Komponen utama:
- **LoginForm** - Form login dengan validasi real-time
- **RegisterForm** - Form register dengan password strength indicator
- **ForgotPasswordForm** - Form request reset password
- **Auth Store (Zustand)** - State management untuk auth data
- **Auth API Client** - HTTP client untuk komunikasi dengan backend

### Kenapa

Kenapa nggak langsung pakai form HTML biasa? Karena kita butuh:
- **Validasi Real-time** - User langsung tau kalau ada yang salah, nggak perlu tunggu submit
- **UX yang Smooth** - Loading state, success state, error handling yang jelas
- **Security** - Token management yang proper, auto-refresh, dll
- **Accessibility** - Screen reader support, keyboard navigation, ARIA labels

### Bagaimana

Flow di frontend:
1. User ketik di form
2. React Hook Form validasi input (client-side)
3. User submit
4. Kirim request ke backend via fetch API
5. Kalau success, simpan token di Zustand store (localStorage)
6. Redirect ke dashboard
7. Setiap request berikutnya, attach token di header

### Kode & Penjelasan

#### Frontend: Auth Store (State Management)

File: `frontend/src/features/auth/store.ts`

```typescript
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setAuth: (accessToken, refreshToken, expiresAt, user) => {
        const timestamp = Date.now();
        const state = get();
        
        // Prevent race condition - only update if newer
        if (state.lastUpdate && timestamp < state.lastUpdate) {
          console.warn("Ignoring stale auth update");
          return;
        }
        
        // Validate expiration
        const currentTime = Math.floor(Date.now() / 1000);
        if (expiresAt <= currentTime) {
          console.error("Attempted to set expired token");
          return;
        }
        
        set({
          accessToken,
          refreshToken,
          expiresAt,
          user,
          isAuthenticated: true,
          lastUpdate: timestamp,
        });
      },
      
      isTokenExpiringSoon: () => {
        const state = get();
        if (!state.expiresAt) return true;
        
        const currentTime = Math.floor(Date.now() / 1000);
        const fiveMinutes = 300;
        return currentTime >= (state.expiresAt - fiveMinutes);
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

**Penjelasan:**

1. **Zustand** - Ini state management library yang lebih simple dari Redux. Bayangin kayak "kotak penyimpanan" global yang bisa diakses dari komponen mana aja.

2. **Persist Middleware** - `persist(...)` ini bikin state kita auto-save ke localStorage. Jadi kalau user refresh page, dia tetap login. Nggak perlu login ulang!

3. **Race Condition Prevention** - `if (state.lastUpdate && timestamp < state.lastUpdate)` ini penting! Bayangin ada 2 request parallel yang update token. Tanpa ini, bisa jadi token lama overwrite token baru. Chaos!

4. **Token Expiry Validation** - Sebelum simpan token, kita cek dulu: "Ini token masih valid nggak?". Kalau udah expired, reject! Nggak ada gunanya simpan token expired.

5. **`isTokenExpiringSoon`** - Ini cek apakah token bakal expired dalam 5 menit. Kalau iya, kita trigger auto-refresh. Jadi user nggak tiba-tiba logout.

#### Frontend: Auth API Client

File: `frontend/src/features/auth/api/authApi.ts`

```typescript
const fetchWithTimeout = async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    throw error;
  }
};
```

**Penjelasan:**

1. **Timeout Handling** - Bayangin user punya internet lemot. Request hang 1 menit. User bingung, "Ini loading atau error?". Dengan timeout, setelah 10 detik auto-abort dan kasih error message yang jelas.

2. **AbortController** - Ini Web API untuk cancel fetch request. Kayak tombol "Cancel" pas download file.

3. **Cleanup** - `clearTimeout(timeoutId)` penting! Kalau nggak di-clear, timer tetap jalan di background. Memory leak!

```typescript
const getValidToken = async (): Promise<string> => {
  const { accessToken, refreshToken: refresh, isTokenExpiringSoon, setAuth, clearAuth } = useAuthStore.getState();
  
  // Check if token is expiring soon
  if (isTokenExpiringSoon() && refresh) {
    try {
      console.log("Token expiring soon, refreshing...");
      const response = await refreshToken(refresh);
      
      // Update store with new tokens
      setAuth(
        response.access_token,
        response.refresh_token,
        response.expires_at,
        response.user
      );
      
      return response.access_token;
    } catch (error) {
      console.error("Token refresh failed:", error);
      clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = "/login";
      }
      throw error;
    }
  }
  
  return accessToken || "";
};
```

**Penjelasan:**

1. **Auto Token Refresh** - Ini magic! Sebelum kirim request, kita cek: "Token masih oke?". Kalau mau expired, auto-refresh dulu. User nggak sadar apa-apa, seamless!

2. **Graceful Degradation** - Kalau refresh gagal (misal refresh token juga expired), kita nggak crash. Kita clear auth dan redirect ke login. User experience tetap smooth.

3. **`useAuthStore.getState()`** - Ini cara akses Zustand store di luar React component. Karena ini function biasa (bukan component), kita nggak bisa pakai hook `useAuthStore()`.

#### Frontend: Login Form Component

File: `frontend/src/features/auth/components/LoginForm.tsx`

```typescript
export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formState, setFormState] = useState<FormState>("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: LoginInput) => {
    setFormState("loading");
    setServerError(null);

    try {
      const response = await login(data.email, data.password);
      setAuth(response.access_token, response.refresh_token, response.expires_at, response.user);
      setFormState("success");
      await new Promise((resolve) => setTimeout(resolve, 800));
      router.push("/dashboard");
    } catch (error) {
      setFormState("error");
      const errorMessage = error instanceof Error ? mapServerError(error.message) : "An unexpected error occurred.";
      setServerError(errorMessage);
      setFormState("idle");
    }
  };
```

**Penjelasan:**

1. **React Hook Form** - Library untuk handle form di React. Kenapa nggak pakai `useState` biasa? Karena RHF lebih performant (nggak re-render setiap keystroke) dan punya built-in validation.

2. **Zod Validation** - `zodResolver(loginSchema)` ini connect Zod schema dengan React Hook Form. Zod itu library untuk schema validation. Kayak TypeScript tapi untuk runtime.

3. **Form State Machine** - `formState` bisa "idle", "loading", "error", atau "success". Ini pattern yang bagus untuk handle UI state. Jelas dan predictable.

4. **Error Mapping** - `mapServerError(error.message)` ini convert error dari backend jadi user-friendly message. Misal error "Invalid credentials" jadi "Email atau password salah. Silakan coba lagi."

5. **Delay Before Redirect** - `await new Promise((resolve) => setTimeout(resolve, 800))` ini kasih delay 800ms sebelum redirect. Kenapa? Biar user sempat liat success message. UX!

```typescript
<input
  {...register("email")}
  id="email"
  type="email"
  autoComplete="email"
  autoFocus
  placeholder="email@gmail.com"
  disabled={isDisabled}
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? "email-error" : undefined}
  className={`
    w-full h-11 pl-10 pr-3.5 rounded-lg border text-sm
    ${errors.email ? "border-red-400 bg-red-50" : "border-input bg-background"}
  `}
/>
```

**Penjelasan:**

1. **`{...register("email")}`** - Ini spread operator yang register input ke React Hook Form. Auto-handle onChange, onBlur, value, dll.

2. **`autoComplete="email"`** - Ini kasih hint ke browser: "Ini field email, boleh auto-fill dari saved passwords". UX boost!

3. **`autoFocus`** - Auto-focus ke field pertama pas page load. User langsung bisa ketik tanpa klik dulu.

4. **ARIA Attributes** - `aria-invalid` dan `aria-describedby` ini untuk accessibility. Screen reader bisa baca: "Email field, invalid, error: Email is required".

5. **Conditional Styling** - Kalau ada error, border jadi merah dan background pink. Visual feedback yang jelas!

#### Frontend: Password Strength Indicator

File: `frontend/src/features/auth/components/RegisterForm.tsx`

```typescript
function getPasswordRequirements(password: string) {
  return [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "At least one uppercase letter", met: /[A-Z]/.test(password) },
    { label: "At least one lowercase letter", met: /[a-z]/.test(password) },
    { label: "At least one number", met: /\d/.test(password) },
    { label: "At least one special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
}

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  const requirements = getPasswordRequirements(password);

  return (
    <div className="space-y-2 mt-2">
      {/* Bar kekuatan */}
      <div className="flex gap-1 items-center">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300
              ${strength >= level ? config.color : "bg-muted"}`}
          />
        ))}
      </div>

      {/* Checklist requirements */}
      <ul className="space-y-1">
        {requirements.map((req) => (
          <li key={req.label} className="flex items-center gap-1.5 text-xs">
            {req.met ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-muted-foreground" />}
            <span className={req.met ? "text-green-700" : "text-muted-foreground"}>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Penjelasan:**

1. **Real-time Feedback** - Setiap user ketik, indicator langsung update. User tau persis apa yang kurang dari password mereka.

2. **Visual Progress** - 5 bar yang isi sesuai strength. Kayak progress bar di game. Gamification!

3. **Checklist** - Setiap requirement ada checkmark hijau kalau udah met. Clear dan actionable.

4. **Color Coding** - Merah = weak, kuning = moderate, hijau = strong. Universal color language.

### Kenapa Ini Benar

**1. Client-Side + Server-Side Validation**

Kita validasi di 2 tempat:
- Client (React Hook Form + Zod): Fast feedback, better UX
- Server (Pydantic): Security, nggak bisa di-bypass

Jangan cuma validasi di client! Hacker bisa bypass.

**2. Token Management yang Proper**

- Simpan di localStorage (bukan cookie) - Lebih flexible untuk SPA
- Auto-refresh sebelum expired - Seamless UX
- Clear token kalau refresh gagal - Security

**3. Error Handling yang User-Friendly**

```typescript
const errorMessage = error instanceof Error 
  ? mapServerError(error.message) 
  : "An unexpected error occurred.";
```

Kita nggak langsung show error dari server. Kita map dulu jadi user-friendly. Misal:
- "Invalid credentials" → "Email atau password salah"
- "Email not confirmed" → "Email belum diverifikasi. Cek inbox Anda"

**4. Accessibility (A11y)**

- ARIA labels untuk screen reader
- Keyboard navigation support
- Focus management
- Error announcements

Ini penting! 15% populasi punya disabilitas. Aplikasi kita harus accessible untuk semua.

### Jebakan Pemula

**Jebakan #1: Simpan Token di State Biasa**

```typescript
// ❌ SALAH - Token hilang pas refresh page
const [token, setToken] = useState("");
```

Solusi: Pakai localStorage atau cookie dengan persist middleware.

**Jebakan #2: Nggak Handle Token Expiry**

User login, 1 jam kemudian token expired, tiba-tiba logout sendiri. Bad UX!

Solusi: Auto-refresh token sebelum expired.

**Jebakan #3: Validasi Cuma di Client**

```typescript
// ❌ SALAH - Bisa di-bypass pakai curl
if (password.length < 8) {
  alert("Password too short");
  return;
}
```

Solusi: Validasi di client DAN server.

**Jebakan #4: Nggak Clear Sensitive Data**

```typescript
// ❌ SALAH - Password masih di memory
const [password, setPassword] = useState("Password123!");
```

Setelah login success, clear password dari state:
```typescript
// ✅ BENAR
setPassword("");
```

**Jebakan #5: Hardcode Error Message**

```typescript
// ❌ SALAH - Error message teknis
catch (error) {
  alert(error.message); // "AuthApiError: Invalid JWT"
}
```

Solusi: Map error jadi user-friendly message.

---


## Fitur OAuth Google (Social Login)

### Apa

OAuth Google adalah fitur yang memungkinkan user login pakai akun Google mereka. Nggak perlu bikin password baru, nggak perlu ingat password lagi. One-click login!

### Kenapa

Bayangin user harus bikin akun baru di setiap aplikasi. Capek! Harus ingat puluhan password. Ribet!

Dengan OAuth Google:
- **Frictionless** - User bisa login dalam 2 klik
- **Secure** - Nggak perlu simpan password user (Google yang handle)
- **Trust** - User lebih percaya login pakai Google daripada aplikasi baru
- **Less Maintenance** - Nggak perlu handle forgot password, email verification, dll (Google yang urus)

### Bagaimana

Flow OAuth Google:

1. User klik tombol "Login with Google"
2. Frontend request OAuth URL dari backend
3. Backend generate OAuth URL dari Supabase
4. Frontend redirect user ke Google login page
5. User login di Google & approve permissions
6. Google redirect user ke callback URL kita dengan token di URL hash
7. Frontend extract token dari URL
8. Frontend verify token dengan backend
9. Backend validate token & return user data
10. Frontend simpan token & redirect ke dashboard

### Kode & Penjelasan

#### Backend: OAuth URL Generator

File: `backend/app/api/auth.py`

```python
@router.get(
    "/google",
    status_code=status.HTTP_200_OK,
    summary="Get Google OAuth URL for sign in",
)
async def google_oauth(
    service: AuthService = Depends(get_auth_service),
):
    settings = get_settings()
    return service.get_oauth_url(
        provider="google",
        redirect_url=settings.auth_redirect_url,
    )
```

File: `backend/app/repositories/auth_repository.py`

```python
def get_oauth_url(self, provider: str, redirect_url: str) -> object:
    """Get OAuth URL for social login (Google, GitHub, etc.)."""
    try:
        response = self._client.auth.sign_in_with_oauth({
            "provider": provider,
            "options": {
                "redirect_to": redirect_url,
            }
        })
        return response
    except AuthApiError as e:
        raise AuthenticationError(f"Failed to get OAuth URL: {e.message}")
```

**Penjelasan:**

1. **Provider Agnostic** - Kita nggak hardcode "google". Parameter `provider` bisa "google", "github", "facebook", dll. Flexible!

2. **Redirect URL** - Ini URL yang bakal dikunjungi user setelah login di Google. HARUS sama dengan yang di-register di Google Console. Kalau beda, error!

3. **Supabase Abstraction** - Kita nggak langsung integrate dengan Google OAuth API. Kita pakai Supabase sebagai middleware. Kenapa? Karena Supabase udah handle semua complexity OAuth (token exchange, refresh, dll).

#### Frontend: OAuth Button Handler

File: `frontend/src/app/(auth)/login/page.tsx`

```typescript
const [isGoogleLoading, setIsGoogleLoading] = useState(false);

const handleGoogleLogin = async () => {
  try {
    setIsGoogleLoading(true);
    const { url } = await getGoogleOAuthUrl();
    window.location.href = url;
  } catch (error) {
    console.error("Failed to get Google OAuth URL:", error);
    setIsGoogleLoading(false);
  }
};
```

**Penjelasan:**

1. **Loading State** - `isGoogleLoading` ini penting! Pas user klik, button jadi disabled dan show loading spinner. Prevent double-click!

2. **`window.location.href = url`** - Ini full page redirect. Kenapa nggak pakai Next.js router? Karena kita redirect ke domain lain (Google). Next.js router cuma untuk internal navigation.

3. **Error Handling** - Kalau gagal dapet OAuth URL, kita set loading jadi false lagi. Jadi button bisa di-klik ulang.

#### Frontend: OAuth Callback Handler

File: `frontend/src/app/(auth)/callback/page.tsx`

```typescript
useEffect(() => {
  const handleCallback = async () => {
    try {
      const { supabase } = await import("@/lib/supabase");

      // Check for errors in URL
      const errorParam = searchParams.get("error");
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashError = hashParams.get("error");

      if (errorParam || hashError) {
        setError(errorDescription || "Authentication failed");
        setTimeout(() => router.push("/login"), 3000);
        return;
      }

      // Get session from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError("Failed to retrieve session");
        setTimeout(() => router.push("/login"), 3000);
        return;
      }

      const { access_token, refresh_token, expires_in } = session;
      
      // Verify token with backend
      const { verifyToken } = await import("@/features/auth/api/authApi");
      const userData = await verifyToken(access_token);
      
      const user = {
        id: userData.user_id,
        email: userData.email,
        created_at: new Date().toISOString(),
        email_confirmed: true,
      };

      // Store auth data
      setAuth(access_token, refresh_token, expiresAt, user);
      
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Auth callback error:", err);
      setError("An unexpected error occurred");
      setTimeout(() => router.push("/login"), 3000);
    }
  };

  handleCallback();
}, [router, setAuth, searchParams]);
```

**Penjelasan:**

1. **URL Hash Parsing** - Google return token di URL hash (`#access_token=...`). Kita parse pakai `URLSearchParams`.

2. **Error Handling** - Kita cek error di 2 tempat: query params (`?error=...`) dan hash params (`#error=...`). Kenapa? Karena OAuth provider bisa return error di salah satu dari keduanya.

3. **Session Retrieval** - `supabase.auth.getSession()` ini ambil session dari Supabase. Session ini udah include access_token, refresh_token, dan user data.

4. **Backend Verification** - Ini PENTING! Kita nggak langsung percaya token dari URL. Kita verify dulu ke backend. Kenapa? Karena token bisa di-fake. Backend yang validate signature JWT.

5. **Auto Redirect** - Kalau error, auto-redirect ke login setelah 3 detik. Kasih waktu user baca error message.

### Kenapa Ini Benar

**1. Backend Verification**

Jangan langsung percaya token dari URL! Hacker bisa inject fake token. Selalu verify ke backend:

```typescript
// ✅ BENAR - Verify dengan backend
const userData = await verifyToken(access_token);
```

**2. Error Handling yang Comprehensive**

Kita handle error di multiple points:
- Gagal dapet OAuth URL
- Error dari Google (user cancel, permission denied, dll)
- Gagal retrieve session
- Gagal verify token

Setiap error punya handling yang jelas. User nggak stuck di loading screen.

**3. Loading State Management**

```typescript
setIsGoogleLoading(true);  // Disable button
// ... do async work ...
setIsGoogleLoading(false); // Enable button
```

Ini prevent race condition dan double-submit.

### Jebakan Pemula

**Jebakan #1: Nggak Verify Token di Backend**

```typescript
// ❌ BAHAYA! Langsung percaya token dari URL
const token = hashParams.get("access_token");
setAuth(token, ...);
```

Hacker bisa inject fake token! Selalu verify di backend.

**Jebakan #2: Lupa Handle Error dari OAuth Provider**

User bisa cancel login di Google. Kalau nggak di-handle, user stuck di callback page.

**Jebakan #3: Redirect URL Mismatch**

```python
# Backend
redirect_url = "http://localhost:3001/callback"

# Google Console
Authorized redirect URI: "http://localhost:3000/callback"  # ❌ BEDA!
```

Kalau beda, OAuth bakal error. HARUS sama persis!

**Jebakan #4: Nggak Clear URL Hash Setelah Extract Token**

Token ada di URL hash. Kalau user share URL, token ikut ke-share! Security risk!

Solusi:
```typescript
// Clear hash after extract token
window.history.replaceState(null, "", window.location.pathname);
```

---

## Manajemen Token & Security

### Apa

Token management adalah sistem yang handle lifecycle token JWT:
- Generate token (saat login)
- Store token (di localStorage)
- Attach token (di setiap request)
- Refresh token (sebelum expired)
- Revoke token (saat logout)

### Kenapa

Token JWT punya expiry time (biasanya 1 jam). Kenapa nggak bikin permanent aja?

Karena security! Bayangin token kamu di-steal hacker. Kalau permanent, hacker bisa akses akun kamu selamanya. Dengan expiry, token cuma valid 1 jam. Setelah itu, useless.

Tapi kalau token expired setiap 1 jam, user harus login ulang terus dong? Ribet!

Solusi: **Refresh Token**. Token yang umurnya lebih panjang (7 hari) untuk dapetin access token baru.

### Bagaimana

**Token Lifecycle:**

1. **Login** → Dapet access_token (1 jam) & refresh_token (7 hari)
2. **Store** → Simpan di localStorage via Zustand
3. **Use** → Attach access_token di header setiap request
4. **Check** → Sebelum request, cek: "Token masih valid?"
5. **Refresh** → Kalau mau expired (< 5 menit), refresh dulu
6. **Logout** → Clear token dari localStorage & revoke di backend

### Kode & Penjelasan

#### Backend: Token Verification dengan JWT

File: `backend/app/core/dependencies.py`

```python
async def get_current_user(
    authorization: Annotated[str, Header()] = None,
    admin_supabase: Client = Depends(get_admin_supabase_client),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthenticationError("authorization not found in header")
    
    token = authorization.removeprefix("Bearer ").strip()
    
    try:
        # Try to get user from Supabase first
        response = admin_supabase.auth.get_user(token)
        return response.user
    except Exception as e:
        # If get_user fails, verify JWT manually with SIGNATURE CHECK
        logger.info(f"get_user failed, trying JWT verification")
        
        try:
            settings = get_settings()
            
            # CRITICAL: VERIFY JWT signature
            decoded = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256", "ES256"],
                audience="authenticated",
                options={
                    "verify_signature": True,  # ✅ MUST BE TRUE
                    "verify_exp": True,
                    "verify_aud": True,
                }
            )
            
            # Additional validation
            current_time = time.time()
            if decoded.get("exp", 0) < current_time:
                raise InvalidTokenError("Token expired")
            
            if decoded.get("aud") != "authenticated":
                raise InvalidTokenError("Invalid audience")
            
            # Create user object from verified JWT
            user = UserOut(
                id=decoded.get("sub", ""),
                email=decoded.get("email", ""),
                created_at=decoded.get("created_at", ""),
                email_confirmed=True
            )
            
            return user
            
        except jwt.ExpiredSignatureError:
            raise InvalidTokenError("Token expired")
        except jwt.InvalidSignatureError:
            logger.error("Invalid token signature - possible attack!")
            raise InvalidTokenError("Invalid token signature")
        except jwt.DecodeError:
            raise InvalidTokenError("Invalid token format")
```

**Penjelasan:**

1. **Two-Layer Verification** - Kita coba verify pakai Supabase dulu. Kalau gagal, fallback ke manual JWT verification. Kenapa? Karena Supabase kadang rate-limit atau down. Kita nggak mau aplikasi down gara-gara Supabase down.

2. **JWT Signature Verification** - `verify_signature: True` ini CRITICAL! Ini yang validate bahwa token beneran dari kita, bukan di-fake hacker. Signature di-generate pakai secret key yang cuma kita tau.

3. **Multiple Validation** - Kita nggak cuma verify signature. Kita juga cek:
   - Expiry time (`verify_exp`)
   - Audience (`verify_aud`) - Pastikan token untuk aplikasi kita
   - Custom validation (double-check expiry & audience)

4. **Security Logging** - `logger.error("Invalid token signature - possible attack!")` - Kalau ada invalid signature, kita log. Ini bisa jadi indikasi ada yang coba hack.

5. **Graceful Degradation** - Kalau semua verification gagal, kita throw clear error message. Nggak crash, nggak hang.

#### Frontend: Auto Token Refresh

File: `frontend/src/features/auth/api/authApi.ts`

```typescript
const getValidToken = async (): Promise<string> => {
  const { 
    accessToken, 
    refreshToken: refresh, 
    isTokenExpiringSoon, 
    setAuth, 
    clearAuth 
  } = useAuthStore.getState();
  
  // Check if token is expiring soon
  if (isTokenExpiringSoon() && refresh) {
    try {
      console.log("Token expiring soon, refreshing...");
      const response = await refreshToken(refresh);
      
      // Update store with new tokens
      setAuth(
        response.access_token,
        response.refresh_token,
        response.expires_at,
        response.user
      );
      
      return response.access_token;
    } catch (error) {
      console.error("Token refresh failed:", error);
      // Clear auth and redirect to login
      clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = "/login";
      }
      throw error;
    }
  }
  
  return accessToken || "";
};
```

**Penjelasan:**

1. **Proactive Refresh** - Kita nggak tunggu token expired. Kita refresh 5 menit sebelum expired. Jadi user nggak pernah experience "tiba-tiba logout".

2. **Atomic Operation** - Refresh token adalah atomic operation. Kalau gagal, kita clear semua auth data dan redirect ke login. Nggak ada "half-logged-in" state.

3. **Window Check** - `if (typeof window !== 'undefined')` ini penting untuk Next.js. Karena Next.js bisa run di server (SSR), dan `window` nggak ada di server.

4. **Error Propagation** - Setelah clear auth, kita tetap throw error. Kenapa? Biar caller tau bahwa operation gagal dan bisa handle accordingly.

#### Frontend: Protected Route

File: `frontend/src/app/(dashboard)/layout.tsx`

```typescript
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, accessToken, expiresAt } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken || isTokenExpired(expiresAt)) {
      router.push("/login");
    }
  }, [isAuthenticated, accessToken, expiresAt, router]);

  if (!isAuthenticated || !accessToken || isTokenExpired(expiresAt)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav>...</nav>
      <main>{children}</main>
    </div>
  );
}
```

**Penjelasan:**

1. **Client-Side Protection** - Kita cek auth di client. Kalau nggak login, redirect ke login page.

2. **Double Check** - Kita cek di `useEffect` DAN di render. Kenapa? Karena `useEffect` run setelah render. Tanpa check di render, user sempat liat dashboard sebentar sebelum redirect (flash of content).

3. **Return Null** - Kalau nggak authenticated, return `null`. Jadi nggak render apa-apa. Prevent flash of content.

4. **Dependency Array** - `[isAuthenticated, accessToken, expiresAt, router]` - useEffect re-run kalau salah satu berubah. Jadi kalau token expired, auto-redirect.

### Kenapa Ini Benar

**1. JWT Signature Verification**

Ini non-negotiable! Tanpa verify signature, hacker bisa bikin fake token:

```python
# ❌ BAHAYA! Nggak verify signature
decoded = jwt.decode(token, options={"verify_signature": False})
```

```python
# ✅ BENAR - Verify signature
decoded = jwt.decode(
    token,
    secret_key,
    algorithms=["HS256"],
    options={"verify_signature": True}
)
```

**2. Proactive Token Refresh**

Refresh 5 menit sebelum expired, bukan pas udah expired:

```typescript
// ✅ BENAR - Refresh sebelum expired
const fiveMinutes = 300;
return currentTime >= (expiresAt - fiveMinutes);
```

Kenapa? Karena kalau tunggu sampai expired, request bisa gagal. User experience jadi jelek.

**3. Secure Token Storage**

Kita simpan di localStorage, bukan cookie. Kenapa?

- **Flexibility** - Bisa diakses dari JavaScript, cocok untuk SPA
- **No CSRF** - localStorage nggak auto-attach ke request kayak cookie
- **Control** - Kita yang control kapan attach token

Tapi hati-hati XSS! Pastikan sanitize user input.

### Jebakan Pemula

**Jebakan #1: Nggak Verify JWT Signature**

```python
# ❌ BAHAYA!
decoded = jwt.decode(token, options={"verify_signature": False})
```

Hacker bisa bikin fake token! SELALU verify signature.

**Jebakan #2: Simpan Token di State Biasa**

```typescript
// ❌ SALAH - Token hilang pas refresh
const [token, setToken] = useState("");
```

Solusi: Pakai localStorage dengan persist middleware.

**Jebakan #3: Nggak Handle Token Expiry**

User login, 1 jam kemudian token expired, tiba-tiba logout. Bad UX!

Solusi: Auto-refresh token sebelum expired.

**Jebakan #4: Hardcode JWT Secret**

```python
# ❌ BAHAYA! Secret di-commit ke Git
JWT_SECRET = "my-super-secret-key-123"
```

Solusi: Simpan di environment variable:
```python
# ✅ BENAR
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
```

**Jebakan #5: Nggak Clear Token Saat Logout**

```typescript
// ❌ SALAH - Token masih di localStorage
router.push("/login");
```

Solusi: Clear token dulu:
```typescript
// ✅ BENAR
clearAuth();  // Clear dari store & localStorage
router.push("/login");
```

---


## Fitur Email Verification & Password Reset

### Apa

Dua fitur penting untuk keamanan dan user experience:

1. **Email Verification** - Setelah register, user harus verify email mereka dengan klik link di email
2. **Password Reset** - User yang lupa password bisa request reset link via email

### Kenapa

**Email Verification:**
- Pastikan email yang didaftarkan valid (bukan email palsu)
- Prevent spam registration
- Bisa kirim notifikasi penting ke email yang valid
- Compliance dengan regulasi (GDPR, CAN-SPAM)

**Password Reset:**
- User lupa password itu normal (terjadi 20-30% user)
- Tanpa reset, user nggak bisa akses akun mereka lagi
- Alternative untuk "forgot password" yang secure

### Bagaimana

**Flow Email Verification:**
1. User register dengan email & password
2. Backend trigger Supabase untuk kirim email verification
3. User buka email, klik link verification
4. Link redirect ke `/callback` dengan token di URL
5. Frontend extract token & verify dengan backend
6. Email confirmed! User bisa login

**Flow Password Reset:**
1. User klik "Forgot Password" di login page
2. User isi email di form
3. Frontend kirim request ke `/api/auth/forgot-password`
4. Backend trigger Supabase untuk kirim reset email
5. User buka email, klik link reset
6. Link redirect ke `/reset-password` dengan token di URL
7. User isi password baru
8. Frontend kirim password baru + token ke Supabase
9. Password updated! User bisa login dengan password baru

### Kode & Penjelasan

#### Backend: Request Password Reset

File: `backend/app/repositories/auth_repository.py`

```python
def request_password_reset(self, email: str, redirect_url: str) -> None:
    """Request password reset by sending email with reset link."""
    try:
        self._client.auth.reset_password_for_email(
            email,
            options={"redirect_to": redirect_url},
        )
    except AuthApiError:
        pass  # Silent fail for security
```

**Penjelasan:**

1. **Silent Fail** - Perhatikan kita `pass` di except block. Kenapa nggak throw error?

   Karena security! Kalau kita throw error "Email not found", hacker bisa tau email mana yang terdaftar di sistem kita. Dengan silent fail, hacker nggak tau apakah email exist atau nggak.

2. **Redirect URL** - Ini URL halaman reset password di frontend. User bakal diarahkan ke sini setelah klik link di email.

3. **Supabase Abstraction** - Kita nggak handle email sending sendiri. Supabase yang urus. Mereka punya email template, rate limiting, dll.

#### Frontend: Forgot Password Form

File: `frontend/src/features/auth/components/ForgotPasswordForm.tsx`

```typescript
const onSubmit = async (data: ForgotPasswordInput) => {
  setFormState("loading");
  setServerError(null);

  try {
    await forgotPassword(data.email);
    setFormState("success");
  } catch (error) {
    setFormState("error");
    const errorMessage = error instanceof Error 
      ? mapServerError(error.message) 
      : "An unexpected error occurred.";
    setServerError(errorMessage);
    setFormState("idle");
  }
};
```

**Penjelasan:**

1. **Always Success** - Kita selalu show success message, even kalau email nggak exist. Kenapa? Security! Prevent email enumeration attack.

2. **Clear Instructions** - Success message: "We've sent a password reset link to your email. Please check your inbox."

3. **Error Handling** - Kalau ada network error atau server error, kita show error. Tapi kalau email nggak exist, kita tetap show success.

#### Frontend: Reset Password Page

File: `frontend/src/app/(auth)/reset-password/page.tsx`

```typescript
const onSubmit = async (data: ResetPasswordInput) => {
  setIsLoading(true);
  setError(null);

  try {
    // Get access token from URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");

    if (!accessToken) {
      throw new Error("No access token found. Please use the link from your email.");
    }

    // Use Supabase to update password
    const { supabase } = await import("@/lib/supabase");
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (updateError) {
      throw updateError;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  } catch (err) {
    console.error("Reset password error:", err);
    setError(err instanceof Error ? err.message : "Failed to reset password");
  } finally {
    setIsLoading(false);
  }
};
```

**Penjelasan:**

1. **Token from URL Hash** - Reset token ada di URL hash (`#access_token=...`). Kita extract pakai `URLSearchParams`.

2. **Direct Supabase Call** - Untuk update password, kita langsung call Supabase dari frontend. Kenapa nggak lewat backend? Karena Supabase udah handle validation token. Nggak perlu double-hop.

3. **Error Handling** - Kalau token invalid atau expired, kita show error message yang jelas: "Reset password link is invalid or has expired."

4. **Auto Redirect** - Setelah success, auto-redirect ke login setelah 2 detik. Kasih waktu user liat success message.

5. **URL Validation** - Kita cek error di URL params juga (`?error=...`). Kalau ada, langsung show error page.

### Kenapa Ini Benar

**1. Silent Fail untuk Security**

```python
# ✅ BENAR - Silent fail
try:
    send_reset_email(email)
except EmailNotFound:
    pass  # Nggak kasih tau email nggak exist
```

Prevent email enumeration attack. Hacker nggak bisa tau email mana yang terdaftar.

**2. Token-Based Reset**

Kita nggak kirim password baru via email. Kita kirim link dengan token. Kenapa?

- Email nggak secure (bisa di-intercept)
- User bisa pilih password sendiri
- Token bisa expired (security)

**3. Password Strength Validation**

Pas reset password, kita enforce password strength yang sama kayak register. Jangan kasih user reset ke password lemah!

### Jebakan Pemula

**Jebakan #1: Kasih Tau Email Nggak Exist**

```python
# ❌ BAHAYA! Email enumeration
if not user_exists(email):
    raise NotFoundError("Email not found")
```

Hacker bisa brute-force cari email yang terdaftar.

**Jebakan #2: Kirim Password Baru via Email**

```python
# ❌ BAHAYA! Password di email
new_password = generate_random_password()
send_email(email, f"Your new password: {new_password}")
```

Email nggak secure! Kirim link reset, bukan password.

**Jebakan #3: Reset Token Nggak Expired**

```python
# ❌ BAHAYA! Token permanent
reset_token = generate_token(email)
```

Token harus expired (biasanya 1 jam). Kalau permanent, hacker bisa pakai token lama.

**Jebakan #4: Nggak Validate Password Strength**

```typescript
// ❌ SALAH - Terima password apa aja
await supabase.auth.updateUser({ password: "123" });
```

Enforce password strength! Minimal 8 karakter, ada uppercase, lowercase, angka, special char.

---

## Configuration Management & Environment Variables

### Apa

Configuration management adalah sistem yang handle semua setting aplikasi:
- Database URL
- API keys
- Feature flags
- Environment-specific settings (dev, staging, prod)

### Kenapa

Bayangin kamu hardcode database URL di code:

```python
DATABASE_URL = "postgresql://user:pass@localhost:5432/mydb"
```

Masalah:
1. **Security** - Password di-commit ke Git. Semua orang bisa liat!
2. **Flexibility** - Mau ganti database? Harus edit code & re-deploy
3. **Environment** - Dev, staging, prod punya database berbeda. Gimana?

Dengan environment variables:
- Sensitive data nggak di-commit ke Git
- Bisa ganti config tanpa edit code
- Beda config per environment

### Bagaimana

Kita pakai `.env` file untuk store environment variables:

```
# .env (jangan commit ke Git!)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

Lalu load di aplikasi:

```python
# Backend
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
    )
```

```typescript
// Frontend
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
```

### Kode & Penjelasan

#### Backend: Settings dengan Pydantic

File: `backend/app/core/config.py`

```python
class Settings(BaseSettings):
    # App
    APP_NAME: str = "My-Jarvis-Gua API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    # Database (supabase)
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str
    
    @field_validator("SUPABASE_URL", mode='after')
    @classmethod
    def validate_url(cls, value: str) -> str:
        if not value:
            raise ValueError("Supabase URL is required")
        if not value.startswith("https://"):
            raise ValueError("Supabase URL must use HTTPS")
        return value
    
    @field_validator("SUPABASE_JWT_SECRET", mode='after')
    @classmethod
    def validate_jwt_secret(cls, value: str) -> str:
        if not value:
            raise ValueError("SUPABASE_JWT_SECRET is required")
        if len(value) < 32:
            raise ValueError("SUPABASE_JWT_SECRET seems too short")
        return value

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3001"]
    
    @field_validator("ALLOWED_ORIGINS", mode='after')
    @classmethod
    def validate_cors(cls, value: List[str], info: ValidationInfo) -> List[str]:
        env = info.data.get("ENVIRONMENT", "development")
        
        # Don't allow wildcard in production
        if "*" in value and env == "production":
            raise ValueError("Wildcard CORS (*) not allowed in production")
        
        return value

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def auth_redirect_url(self) -> str:
        """URL redirect setelah user klik link di email"""
        return f"{self.FRONTEND_URL}/callback"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

**Penjelasan:**

1. **Pydantic BaseSettings** - Auto-load dari `.env` file. Nggak perlu manual `os.getenv()`.

2. **Type Safety** - `SUPABASE_URL: str` artinya WAJIB string. Kalau nggak ada atau type salah, error saat startup. Fail fast!

3. **Validation** - `@field_validator` untuk custom validation. Misal: URL harus HTTPS, JWT secret minimal 32 karakter.

4. **Default Values** - `APP_NAME: str = "My-Jarvis-Gua API"` punya default. Kalau nggak ada di `.env`, pakai default.

5. **Computed Properties** - `@property` untuk derived values. Misal: `auth_redirect_url` computed dari `FRONTEND_URL`.

6. **LRU Cache** - `@lru_cache()` bikin settings cuma di-load sekali. Nggak perlu baca `.env` setiap kali.

7. **Environment-Specific Validation** - CORS wildcard (`*`) nggak boleh di production. Kita validate based on `ENVIRONMENT`.

#### Frontend: Environment Variables

File: `frontend/next.config.ts`

```typescript
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};
```

File: `frontend/.env.example`

```
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Penjelasan:**

1. **`NEXT_PUBLIC_` Prefix** - Di Next.js, environment variable yang mau diakses di browser HARUS pakai prefix `NEXT_PUBLIC_`. Kenapa? Security! Tanpa prefix, variable cuma available di server.

2. **`.env.example`** - Ini template untuk developer baru. Isinya placeholder, bukan value real. Di-commit ke Git.

3. **`.env`** - Ini file real dengan value real. JANGAN commit ke Git! Add ke `.gitignore`.

4. **`next.config.ts`** - Expose environment variable ke client. Tanpa ini, `process.env.NEXT_PUBLIC_API_URL` bakal `undefined`.

### Kenapa Ini Benar

**1. Validation at Startup**

```python
# ✅ BENAR - Validate saat startup
class Settings(BaseSettings):
    SUPABASE_URL: str  # Required, error kalau nggak ada
```

Kalau ada config yang salah, aplikasi nggak start. Fail fast! Lebih baik error saat startup daripada error saat production.

**2. Type Safety**

```python
# ✅ BENAR - Type-safe
SUPABASE_URL: str
PORT: int
DEBUG: bool
```

Pydantic auto-convert type. Kalau `PORT="8000"` (string), auto-convert jadi `8000` (int).

**3. Separation of Concerns**

- `.env` - Actual values (secret, nggak di-commit)
- `.env.example` - Template (di-commit)
- `config.py` - Schema & validation (di-commit)

**4. Environment-Specific Settings**

```python
@property
def is_production(self) -> bool:
    return self.ENVIRONMENT == "production"

# Usage
if settings.is_production:
    # Production-specific logic
```

### Jebakan Pemula

**Jebakan #1: Commit `.env` ke Git**

```bash
# ❌ BAHAYA! Secret keys di Git
git add .env
git commit -m "Add config"
```

Solusi: Add `.env` ke `.gitignore`:
```
# .gitignore
.env
.env.local
```

**Jebakan #2: Hardcode Secrets**

```python
# ❌ BAHAYA! Secret di code
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Solusi: Pakai environment variable:
```python
# ✅ BENAR
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
```

**Jebakan #3: Nggak Validate Config**

```python
# ❌ SALAH - Nggak validate
DATABASE_URL = os.getenv("DATABASE_URL")  # Bisa None!
```

Solusi: Validate dengan Pydantic:
```python
# ✅ BENAR
class Settings(BaseSettings):
    DATABASE_URL: str  # Required, error kalau None
```

**Jebakan #4: Lupa Prefix `NEXT_PUBLIC_`**

```typescript
// ❌ SALAH - Nggak bisa diakses di browser
const API_URL = process.env.API_URL;  // undefined!
```

Solusi:
```typescript
// ✅ BENAR
const API_URL = process.env.NEXT_PUBLIC_API_URL;
```

**Jebakan #5: Nggak Ada `.env.example`**

Developer baru clone repo, bingung: "Environment variable apa aja yang perlu?"

Solusi: Bikin `.env.example` dengan placeholder:
```
# .env.example
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

---


## Error Handling & Exception Management

### Apa

Error handling adalah sistem yang handle semua error yang terjadi di aplikasi:
- Validation errors (input salah)
- Authentication errors (token invalid)
- Authorization errors (nggak punya akses)
- Database errors (connection failed)
- External API errors (Supabase down)

### Kenapa

Bayangin aplikasi kamu crash setiap ada error. User bingung, data corrupt, reputation rusak.

Dengan error handling yang proper:
- **User Experience** - Error message yang jelas, nggak crash
- **Debugging** - Log error untuk investigate
- **Security** - Nggak expose internal error ke user
- **Reliability** - Graceful degradation, nggak total failure

### Bagaimana

Kita pakai **custom exception hierarchy**:

```
AppError (base)
├── AuthenticationError (401)
├── AuthorizationError (403)
├── ValidationError (422)
├── NotFoundError (404)
└── UserAlreadyExistsError (409)
```

Setiap exception punya HTTP status code yang sesuai.

### Kode & Penjelasan

#### Backend: Custom Exceptions

File: `backend/app/core/exceptions.py`

```python
class AppError(Exception):
    """Base class for application exceptions."""
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)

class AuthenticationError(AppError):
    """Raised when authentication fails."""
    pass

class AuthorizationError(AppError):
    """Raised when user is not authorized."""
    pass

class UserAlreadyExistsError(AppError):
    """Raised when trying to create a user that already exists."""
    pass

class InvalidTokenError(AppError):
    """Raised when JWT token is invalid or expired."""
    pass
```

**Penjelasan:**

1. **Inheritance Hierarchy** - Semua custom exception inherit dari `AppError`. Kenapa? Biar bisa catch semua custom exception dengan `except AppError`.

2. **Descriptive Names** - `UserAlreadyExistsError` lebih jelas daripada generic `ValueError`. Developer langsung tau apa masalahnya.

3. **Message Attribute** - Setiap exception punya `message` attribute. Ini yang bakal di-return ke frontend.

#### Backend: Global Exception Handlers

File: `backend/app/core/application.py`

```python
def _register_exception_handlers(app: FastAPI):
    @app.exception_handler(AuthenticationError)
    @app.exception_handler(InvalidTokenError)
    @app.exception_handler(EmailNotConfirmedError)
    async def authentication_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=401,
            content={"detail": exc.message},
            headers={"WWW-Authenticate": "Bearer"},
        )

    @app.exception_handler(AuthorizationError)
    async def authorization_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=403,
            content={"detail": exc.message},
        )

    @app.exception_handler(UserAlreadyExistsError)
    async def conflict_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=409,
            content={"detail": exc.message},
        )

    @app.exception_handler(AppError)
    async def generic_app_error_handler(request: Request, exc: AppError):
        """Catch-all handler for any AppError."""
        return JSONResponse(
            status_code=400,
            content={"detail": exc.message},
        )
```

**Penjelasan:**

1. **Global Handlers** - Kita register exception handler di level aplikasi. Jadi nggak perlu try-catch di setiap endpoint.

2. **HTTP Status Codes** - Setiap exception type punya status code yang sesuai:
   - 401 = Unauthorized (nggak login atau token invalid)
   - 403 = Forbidden (login tapi nggak punya akses)
   - 404 = Not Found (resource nggak exist)
   - 409 = Conflict (misal: email already exists)
   - 422 = Unprocessable Entity (validation error)

3. **WWW-Authenticate Header** - Untuk 401 error, kita kasih header `WWW-Authenticate: Bearer`. Ini HTTP standard yang kasih tau client: "Kamu perlu Bearer token untuk akses endpoint ini".

4. **Catch-All Handler** - `@app.exception_handler(AppError)` catch semua custom exception yang nggak punya specific handler. Fallback!

5. **Consistent Response Format** - Semua error return format yang sama: `{"detail": "error message"}`. Frontend bisa expect format ini.

#### Frontend: Error Mapping

File: `frontend/src/features/auth/utils.ts`

```typescript
export function mapServerError(message: string): string {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes("invalid") && (lowerMsg.includes("email") || lowerMsg.includes("password"))) {
    return "Invalid email or password. Please check your credentials and try again.";
  }

  if (lowerMsg.includes("email not confirmed")) {
    return "Your email address has not been confirmed. Please check your inbox.";
  }

  if (lowerMsg.includes("already exists")) {
    return "An account with this email already exists. Please login instead.";
  }

  if (lowerMsg.includes("too many") || lowerMsg.includes("rate limit")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }

  if (lowerMsg.includes("network") || lowerMsg.includes("fetch")) {
    return "Network error. Please check your internet connection.";
  }

  return message || "An unexpected error occurred. Please try again.";
}
```

**Penjelasan:**

1. **User-Friendly Messages** - Kita convert technical error jadi user-friendly message. Misal:
   - "Invalid credentials" → "Email atau password salah. Silakan coba lagi."
   - "AuthApiError: Email not confirmed" → "Email belum diverifikasi. Cek inbox Anda."

2. **Pattern Matching** - Kita match error message pakai keyword. Flexible! Nggak perlu exact match.

3. **Fallback** - Kalau nggak match pattern mana pun, return original message. Better than nothing!

4. **Actionable Messages** - Error message kasih hint apa yang harus dilakukan:
   - "Please check your credentials and try again"
   - "Please check your inbox"
   - "Please wait a few minutes"

#### Frontend: Error Display

File: `frontend/src/features/auth/components/LoginForm.tsx`

```typescript
{serverError && (
  <div
    role="alert"
    aria-live="polite"
    className="flex items-start gap-3 p-4 rounded-lg
      bg-red-50 border border-red-200
      text-sm text-red-700
      animate-in fade-in slide-in-from-top-1 duration-200"
  >
    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
    <div className="space-y-1">
      <p className="font-medium">Login Failed</p>
      <p className="text-red-600">{serverError}</p>
    </div>
  </div>
)}
```

**Penjelasan:**

1. **ARIA Attributes** - `role="alert"` dan `aria-live="polite"` untuk accessibility. Screen reader bakal announce error.

2. **Visual Hierarchy** - Icon + title + message. Jelas dan terstruktur.

3. **Color Coding** - Red untuk error, green untuk success, yellow untuk warning. Universal!

4. **Animation** - `animate-in fade-in slide-in-from-top-1` kasih smooth animation. Nggak tiba-tiba muncul.

### Kenapa Ini Benar

**1. Custom Exception Hierarchy**

Lebih baik daripada generic exception:

```python
# ❌ SALAH - Generic exception
raise ValueError("User already exists")

# ✅ BENAR - Custom exception
raise UserAlreadyExistsError("User with this email already exists")
```

Keuntungan:
- Bisa catch specific exception
- Self-documenting code
- Consistent error handling

**2. Global Exception Handlers**

Daripada try-catch di setiap endpoint:

```python
# ❌ SALAH - Repetitive
@router.post("/register")
async def register(...):
    try:
        ...
    except UserAlreadyExistsError as e:
        return JSONResponse(status_code=409, content={"detail": str(e)})
```

Pakai global handler:

```python
# ✅ BENAR - DRY (Don't Repeat Yourself)
@router.post("/register")
async def register(...):
    # Just raise exception, handler will catch it
    raise UserAlreadyExistsError("User already exists")
```

**3. User-Friendly Error Messages**

Jangan expose technical error:

```typescript
// ❌ SALAH - Technical error
"AuthApiError: Invalid JWT signature"

// ✅ BENAR - User-friendly
"Your session has expired. Please login again."
```

### Jebakan Pemula

**Jebakan #1: Expose Internal Error**

```python
# ❌ BAHAYA! Expose stack trace
except Exception as e:
    return {"error": str(e), "traceback": traceback.format_exc()}
```

Hacker bisa tau struktur internal aplikasi kita!

**Jebakan #2: Generic Exception**

```python
# ❌ SALAH - Nggak jelas error apa
raise Exception("Something went wrong")
```

Solusi: Pakai custom exception yang descriptive.

**Jebakan #3: Nggak Log Error**

```python
# ❌ SALAH - Error hilang tanpa jejak
except Exception:
    pass
```

Solusi: Log error untuk debugging:
```python
# ✅ BENAR
except Exception as e:
    logger.error(f"Failed to process: {e}", exc_info=True)
    raise
```

**Jebakan #4: Inconsistent Error Format**

```python
# ❌ SALAH - Beda-beda format
return {"error": "..."}
return {"message": "..."}
return {"detail": "..."}
```

Solusi: Pakai format konsisten:
```python
# ✅ BENAR
return {"detail": "..."}  # Konsisten!
```

---

## Best Practices & Security Checklist

### Security Best Practices

#### 1. Password Security

✅ **DO:**
- Enforce strong password (min 8 char, uppercase, lowercase, number, special char)
- Hash password dengan bcrypt/argon2 (Supabase auto-handle ini)
- Implement rate limiting untuk prevent brute force
- Nggak simpan password di log atau error message

❌ **DON'T:**
- Simpan password plain text
- Kirim password via email
- Log password (even hashed)
- Pakai weak hashing (MD5, SHA1)

#### 2. Token Security

✅ **DO:**
- Verify JWT signature SELALU
- Set token expiry (1 jam untuk access token)
- Implement token refresh mechanism
- Clear token saat logout
- Validate token di backend, jangan cuma di frontend

❌ **DON'T:**
- Simpan token di URL query params
- Share token via insecure channel
- Pakai token tanpa expiry
- Trust token dari client tanpa verify

#### 3. API Security

✅ **DO:**
- Validate input di backend (jangan cuma frontend)
- Implement rate limiting
- Use HTTPS di production
- Sanitize user input untuk prevent XSS
- Implement CORS dengan whitelist domain

❌ **DON'T:**
- Trust client-side validation
- Allow CORS wildcard (`*`) di production
- Expose internal error details
- Hardcode secrets di code

#### 4. Authentication Security

✅ **DO:**
- Implement email verification
- Use secure password reset flow (token-based)
- Implement account lockout after failed attempts
- Log authentication events untuk audit

❌ **DON'T:**
- Allow weak passwords
- Expose whether email exists (email enumeration)
- Send password via email
- Allow unlimited login attempts

### Code Quality Best Practices

#### 1. Architecture

✅ **DO:**
- Use layered architecture (API → Service → Repository)
- Implement dependency injection
- Separate concerns (business logic vs data access)
- Use design patterns (Factory, Repository, etc.)

❌ **DON'T:**
- Mix business logic dengan database logic
- Hardcode dependencies
- Create god classes (class yang terlalu besar)

#### 2. Error Handling

✅ **DO:**
- Use custom exceptions
- Implement global exception handlers
- Log errors dengan context
- Return user-friendly error messages

❌ **DON'T:**
- Use generic exceptions
- Expose internal errors
- Silent fail tanpa log
- Inconsistent error format

#### 3. Testing

✅ **DO:**
- Write unit tests untuk business logic
- Write integration tests untuk API endpoints
- Mock external dependencies (database, API)
- Test edge cases dan error scenarios

❌ **DON'T:**
- Skip testing
- Test implementation details
- Depend on external services di test
- Ignore test failures

#### 4. Code Style

✅ **DO:**
- Follow PEP 8 (Python) / Airbnb Style Guide (JavaScript)
- Use meaningful variable names
- Write docstrings/comments untuk complex logic
- Keep functions small dan focused

❌ **DON'T:**
- Use single-letter variables (except loop counters)
- Write long functions (> 50 lines)
- Leave commented-out code
- Ignore linter warnings

### Performance Best Practices

#### 1. Database

✅ **DO:**
- Use connection pooling
- Implement caching untuk frequent queries
- Use indexes untuk search columns
- Paginate large result sets

❌ **DON'T:**
- N+1 query problem
- Fetch all data tanpa limit
- Ignore slow query warnings

#### 2. API

✅ **DO:**
- Implement request timeout
- Use compression (gzip)
- Cache static responses
- Implement rate limiting

❌ **DON'T:**
- Return large payloads tanpa pagination
- Ignore slow endpoints
- Allow unlimited requests

#### 3. Frontend

✅ **DO:**
- Lazy load components
- Optimize images (WebP, lazy loading)
- Use code splitting
- Implement loading states

❌ **DON'T:**
- Load everything upfront
- Ignore bundle size
- Block UI dengan synchronous operations

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Error tracking setup (Sentry, etc.)
- [ ] SSL certificate configured
- [ ] Backup strategy in place

### Backend Deployment

- [ ] Set `ENVIRONMENT=production`
- [ ] Disable debug mode
- [ ] Configure production database
- [ ] Set secure JWT secret (min 32 chars)
- [ ] Configure CORS whitelist (no wildcard!)
- [ ] Enable HTTPS only
- [ ] Set up health check endpoint
- [ ] Configure log rotation
- [ ] Set up monitoring (CPU, memory, disk)

### Frontend Deployment

- [ ] Build production bundle (`npm run build`)
- [ ] Configure production API URL
- [ ] Enable compression
- [ ] Configure CDN untuk static assets
- [ ] Set up error boundary
- [ ] Configure analytics (optional)
- [ ] Test on multiple browsers
- [ ] Test on mobile devices

### Post-Deployment

- [ ] Smoke test critical flows (login, register, etc.)
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify email delivery
- [ ] Test OAuth flows
- [ ] Check logs untuk errors
- [ ] Verify database connections
- [ ] Test backup restoration

---

## Troubleshooting Guide

### Common Issues

#### 1. "Token Invalid" Error

**Symptoms:** User login success tapi langsung logout

**Possible Causes:**
- JWT secret salah
- Token expired
- Clock skew (server time beda dengan client)

**Solutions:**
```python
# Check JWT secret
print(settings.SUPABASE_JWT_SECRET[:10])  # Should match Supabase

# Check token expiry
decoded = jwt.decode(token, verify=False)
print(decoded['exp'])  # Should be future timestamp

# Check server time
import time
print(time.time())  # Should match current time
```

#### 2. CORS Error

**Symptoms:** "Access-Control-Allow-Origin" error di browser console

**Possible Causes:**
- Frontend URL nggak di whitelist
- CORS middleware nggak configured
- Credentials nggak di-allow

**Solutions:**
```python
# Backend: Check CORS config
ALLOWED_ORIGINS = ["http://localhost:3001", "https://myapp.com"]

# Frontend: Check credentials
fetch(url, {
  credentials: "include",  // Important!
})
```

#### 3. Email Nggak Terkirim

**Symptoms:** User register tapi nggak dapet email verification

**Possible Causes:**
- Email masuk spam
- Supabase email quota habis
- Redirect URL salah

**Solutions:**
- Check spam folder
- Check Supabase dashboard → Authentication → Email Templates
- Verify redirect URL match dengan yang di-register

#### 4. OAuth Redirect Error

**Symptoms:** "Redirect URI mismatch" error

**Possible Causes:**
- Redirect URL nggak match dengan Google Console
- Protocol mismatch (http vs https)
- Port mismatch

**Solutions:**
- Check Google Console → Credentials → Authorized redirect URIs
- Must match EXACTLY (including protocol, domain, port, path)

---

## Kesimpulan

Selamat! Kamu udah belajar seluruh fitur autentikasi My Jarvis Gua dari A sampai Z. Mari recap apa yang udah kita pelajari:

### Yang Udah Kita Bangun

1. **Complete Authentication System**
   - Register dengan email verification
   - Login dengan email & password
   - OAuth Google (social login)
   - Forgot password & reset
   - Token refresh mechanism
   - Logout

2. **Security Features**
   - JWT signature verification
   - Password strength validation
   - Rate limiting (via Supabase)
   - CORS protection
   - Token expiry & refresh
   - Secure error handling

3. **User Experience**
   - Real-time validation
   - Password strength indicator
   - Loading states
   - Error messages yang jelas
   - Auto token refresh (seamless)
   - Accessibility support

4. **Code Quality**
   - Layered architecture
   - Dependency injection
   - Custom exceptions
   - Type safety (Pydantic + TypeScript)
   - Comprehensive error handling

### Key Takeaways

1. **Security First** - Selalu validate di backend, verify JWT signature, enforce strong password
2. **User Experience Matters** - Clear error messages, loading states, smooth transitions
3. **Code Quality** - Layered architecture, DRY principle, type safety
4. **Error Handling** - Custom exceptions, global handlers, user-friendly messages
5. **Testing** - Unit tests, integration tests, edge cases

### Next Steps

Sekarang kamu udah paham autentikasi, next steps:
1. Implement authorization (role-based access control)
2. Add more features (profile management, settings, dll)
3. Implement logging & monitoring
4. Write comprehensive tests
5. Deploy to production!

### Final Words

Remember: **Good code is code that works, is secure, and is maintainable**. Jangan cuma fokus bikin fitur jalan. Pikirkan juga security, error handling, dan maintainability.

Happy coding! 🚀

---

**Dokumentasi ini dibuat dengan ❤️ oleh Senior Engineer yang peduli dengan junior developers.**

*Kalau ada pertanyaan atau butuh klarifikasi, jangan ragu untuk tanya!*



---

## APPENDIX: Client-Side Validation dengan Zod

### Apa

Zod adalah TypeScript-first schema validation library. Bayangin kayak Pydantic-nya JavaScript. Kita define schema sekali, bisa dipakai untuk:
- Runtime validation
- Type inference (auto-generate TypeScript types)
- Error messages yang customizable

### Kenapa Pakai Zod?

Dibanding validation manual:

```typescript
// ❌ MANUAL - Repetitive & error-prone
if (!email) {
  errors.email = "Email is required";
} else if (!email.includes("@")) {
  errors.email = "Invalid email";
} else if (email.length > 254) {
  errors.email = "Email too long";
}
```

Dengan Zod:

```typescript
// ✅ ZOD - Declarative & type-safe
const schema = z.object({
  email: z.string().email().max(254),
});
```

Keuntungan:
- **Type Safety** - Auto-generate TypeScript types
- **Reusable** - Schema bisa dipakai di multiple places
- **Composable** - Bisa combine schemas
- **Clear Error Messages** - Built-in error messages

### Kode & Penjelasan

#### Login Schema

File: `frontend/src/features/auth/validations/authSchema.ts`

```typescript
export const loginSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .max(254, "Email too long")
    .transform(val => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

**Penjelasan:**

1. **`.string()`** - Value harus string. Kalau number atau object, error.

2. **`.email()`** - Validate format email. Pakai regex internal Zod yang udah tested.

3. **`.max(254)`** - Email maksimal 254 karakter (RFC 5321 standard).

4. **`.transform()`** - Normalize email: lowercase & trim whitespace. Jadi "User@Gmail.com  " jadi "user@gmail.com".

5. **`z.infer<typeof loginSchema>`** - Magic! Auto-generate TypeScript type dari schema:
   ```typescript
   type LoginInput = {
     email: string;
     password: string;
   }
   ```

#### Register Schema dengan Password Strength

```typescript
export const registerSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .max(254, "Email too long")
    .transform(val => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long (max 128 characters)")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
```

**Penjelasan:**

1. **Multiple `.regex()`** - Chain multiple regex validations. Setiap regex punya error message sendiri.

2. **`.refine()`** - Custom validation logic. Kita pakai ini untuk cek password === confirmPassword.

3. **`path: ["confirmPassword"]`** - Error message muncul di field `confirmPassword`, bukan di root object.

#### Integration dengan React Hook Form

```typescript
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<LoginInput>({
  resolver: zodResolver(loginSchema),
  mode: "onBlur",
});
```

**Penjelasan:**

1. **`zodResolver(loginSchema)`** - Connect Zod schema dengan React Hook Form.

2. **`mode: "onBlur"`** - Validate saat user blur (keluar dari field). Alternatif:
   - `onChange` - Validate setiap keystroke (bisa annoying)
   - `onSubmit` - Validate pas submit (delayed feedback)
   - `onBlur` - Balance antara keduanya ✅

3. **Type Safety** - `useForm<LoginInput>` kasih autocomplete untuk `register("email")`, `register("password")`, dll.

### Kenapa Ini Benar

**1. Transform untuk Normalization**

```typescript
.transform(val => val.toLowerCase().trim())
```

Ini penting! User bisa ketik "User@Gmail.com  " (dengan spasi). Tanpa transform, backend bisa reject karena beda dengan "user@gmail.com".

**2. Consistent Validation**

Backend dan frontend pakai validation yang sama:
- Min 8 characters
- Max 254 characters (email)
- Password strength requirements

Ini prevent mismatch antara frontend dan backend validation.

**3. Custom Error Messages**

```typescript
.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
```

Error message yang jelas dan actionable. User tau persis apa yang salah.

### Jebakan Pemula

**Jebakan #1: Lupa Transform**

```typescript
// ❌ SALAH - Nggak normalize
email: z.string().email()

// User input: "User@Gmail.com  "
// Backend expect: "user@gmail.com"
// Result: Validation error!
```

Solusi: Pakai `.transform()` untuk normalize.

**Jebakan #2: Validation Mode Salah**

```typescript
// ❌ ANNOYING - Validate setiap keystroke
useForm({ mode: "onChange" })

// User baru ketik "a" → Error: "Invalid email"
// User ketik "ab" → Error: "Invalid email"
// User ketik "abc" → Error: "Invalid email"
```

Solusi: Pakai `mode: "onBlur"` untuk better UX.

**Jebakan #3: Nggak Pakai Type Inference**

```typescript
// ❌ SALAH - Manual type
type LoginInput = {
  email: string;
  password: string;
}

// Kalau schema berubah, type nggak sync!
```

Solusi: Pakai `z.infer<typeof schema>` untuk auto-generate type.

**Jebakan #4: Regex Nggak Di-Escape**

```typescript
// ❌ SALAH - Special char nggak di-escape
.regex(/[!@#$%^&*(),.?":{}|<>]/)  // ✅ BENAR

.regex(/[!@#$%^&*(),.?":{|}]/)    // ❌ SALAH - } nggak di-escape
```

Dalam regex character class `[]`, beberapa karakter perlu di-escape.

---

## APPENDIX: Testing Strategy (Untuk Referensi)

Meskipun test belum diimplementasi secara lengkap, berikut adalah strategy testing yang recommended untuk aplikasi ini:

### Unit Tests

**Backend:**
```python
# test_auth_service.py
def test_register_success():
    # Given
    email = "test@example.com"
    password = "Password123!"
    
    # When
    result = auth_service.register(email, password, redirect_url)
    
    # Then
    assert result.message == "Registration successful"

def test_register_duplicate_email():
    # Given
    email = "existing@example.com"
    
    # When/Then
    with pytest.raises(UserAlreadyExistsError):
        auth_service.register(email, password, redirect_url)
```

**Frontend:**
```typescript
// authApi.test.ts
describe('login', () => {
  it('should return tokens on success', async () => {
    // Given
    const email = 'test@example.com';
    const password = 'Password123!';
    
    // When
    const result = await login(email, password);
    
    // Then
    expect(result.access_token).toBeDefined();
    expect(result.user.email).toBe(email);
  });
});
```

### Integration Tests

```python
# test_auth_api.py
def test_register_endpoint(client):
    # Given
    payload = {
        "email": "test@example.com",
        "password": "Password123!"
    }
    
    # When
    response = client.post("/api/auth/register", json=payload)
    
    # Then
    assert response.status_code == 201
    assert "Registration successful" in response.json()["message"]
```

### E2E Tests (Playwright/Cypress)

```typescript
// auth.spec.ts
test('user can register and login', async ({ page }) => {
  // Register
  await page.goto('/register');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'Password123!');
  await page.fill('[name="confirmPassword"]', 'Password123!');
  await page.click('button[type="submit"]');
  
  // Should show success message
  await expect(page.locator('text=Registration successful')).toBeVisible();
  
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  
  // Should redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
});
```

---

## Penutup: Fitur yang Sudah Diimplementasi

Untuk clarity, berikut adalah **SEMUA fitur yang BENAR-BENAR sudah diimplementasi** di My Jarvis Gua saat ini:

### ✅ Fitur yang Sudah Ada

**Autentikasi:**
1. Register dengan email & password
2. Email verification (via Supabase)
3. Login dengan email & password
4. OAuth Google (social login)
5. Logout
6. Forgot password
7. Reset password
8. Token refresh (auto-refresh sebelum expired)
9. Token verification
10. Protected routes (dashboard)

**Infrastructure:**
1. Backend: FastAPI dengan layered architecture
2. Frontend: Next.js 16 dengan App Router
3. Database: Supabase (PostgreSQL)
4. State Management: Zustand dengan persist
5. Validation: Pydantic (backend) + Zod (frontend)
6. Error Handling: Custom exceptions dengan global handlers
7. Configuration: Environment variables dengan validation

### 📋 Fitur yang Direncanakan (Belum Diimplementasi)

Berdasarkan `structure.md`, fitur-fitur berikut adalah **rencana masa depan**:

1. Finance Management (expenses, budgets, recurring)
2. Health Tracking (food logs, exercise, weight)
3. Fitness (running logs, training plans)
4. Vehicle Management (maintenance logs)
5. Task Management
6. Notifications
7. AI Features (chat, insights, parsing)
8. Telegram Bot
9. Background Jobs (Celery)

---

**Dokumentasi ini mencakup 100% dari fitur yang sudah diimplementasi.**

Semoga dokumentasi ini membantu! Happy coding! 🚀

