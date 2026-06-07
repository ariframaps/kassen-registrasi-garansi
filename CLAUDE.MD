# Panduan Kode Project Next.js & Spec

## Tech Stack & Architecture

- Framework: Next.js 16 (App Router / Route Handlers)
- Language: TypeScript (Strict Type-Safety)
- Database & ORM: PostgreSQL dengan Drizzle ORM
- Auth: Better Auth (Gunakan session/client bawaan)
- Validation: Zod
- Email: Nodemailer
- Pattern: Route-Service Pattern (Route hanya handle HTTP & Middleware, Query/Logika bisnis di folder `services/`)

## Aturan Penulisan Route Handler (Wajib Diikuti)

1. Setiap route handler (`route.ts`) WAJIB memvalidasi skema Zod (Insert Schema).
2. Wajib membungkus proses dengan `try-catch`.
3. Gunakan `authenticationMiddleware()` dan `authorizationMiddleware({ allowedRole, currentRole })` untuk proteksi.
4. Response sukses wajib dibungkus fungsi `successResponse({ message, data })`.
5. Response error wajib dihandle dengan pengecekan `HttpError` dan `normalizeError(error)` seperti pola yang sudah ada di proyek.

## Aturan Pengembangan Frontend (API Client)

1. Dilarang menggunakan fungsi `fetch()` bawaan secara langsung di dalam komponen frontend untuk mengambil data dari backend.
2. Semua fungsi _fetch_ wajib didaftarkan di dalam file `src/lib/api/api-client.ts` menggunakan pembungkus `apiFetch<T>`.
3. Kelompokkan fungsi API berdasarkan fiturnya (Contoh: `productApi`, `authApi`, `dealerApi`, dll).
4. Gunakan prefix base URL `/api/v1` yang sudah ditangani secara otomatis oleh fungsi `apiFetch`.

## Lokasi Database Schema

- Semua definisi tabel dan relasi yang sudah dinormalisasi terletak di direktori `src/db/schemas/` atau `src/db/schema.ts`. Harap periksa skema tersebut untuk melakukan join/query kompleks menggunakan relasi Drizzle.
