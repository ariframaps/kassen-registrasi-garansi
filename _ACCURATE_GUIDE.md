# Panduan Lengkap Integrasi Form Multi-Step Upload Accurate

## 1. Aturan Utama Pengembangan

- **DILARANG KERAS** mengubah tata letak visual, styling Tailwind CSS, struktur HTML JSX, atau nama variabel state utama yang sudah ada di frontend.
- **TUGAS UTAMA:** Menghubungkan fungsi parser lokal dengan API Backend untuk mengubah data Excel bertingkat menjadi data flat array yang siap ditampilkan oleh tabel UI frontend saat ini.

## 2. Struktur Data Mockup (Yang Diharapkan oleh Frontend)

Frontend menggunakan tipe data `PreviewRow` berikut untuk menampilkan tabel review nomor seri secara mendatar (flat):

```typescript
interface PreviewRow {
	serialNumber: string;
	productType: string;
	productCategory: string;
	itemCodeOriginal?: string;
	status: "valid" | "duplicate" | "invalid" | "unknown_type";
	message?: string;
}
```

## 3. Struktur Output dari Parser Nyata (`src/lib/accurate-parser.ts`)

Fungsi `parseDeliveryOrder` menghasilkan objek JSON bertingkat (nested) dengan struktur seperti ini:

```json
{
	"doNumber": "DO.2026.02.24.014",
	"date": "24 Feb 2026",
	"sentBy": ":",
	"orderRef": "DIKIRIM MKO",
	"area": "ORDER 123",
	"shipTo": "JAYA BERSAMA TEKNOLOGI, PT",
	"items": [
		{
			"itemCode": "FDSAFSFSDA",
			"itemDescription": "Electric Drill 13mm",
			"qty": 2,
			"unit": "PCS",
			"serialNumbers": ["SNNEW001XY", "SNNEW002AB"]
		}
	]
}
```

## 4. Alur Integrasi yang Harus Dibuat

### Tahap A: Backend API Validasi (`POST /api/v1/upload/validate`)

Buat endpoint API baru untuk memvalidasi data parser sebelum disimpan ke database.

1. Menerima request body berupa JSON Output dari Parser Nyata (Poin 3).
2. Lakukan iterasi mendatar (flattening) untuk setiap `serialNumbers` di dalam array `items`.
3. Gunakan Drizzle ORM untuk melakukan pengecekan kondisi ke database:
   - Cari data di tabel `item_code_mapping` berdasarkan `itemCode`. Jika ditemukan, ambil nama `product_type` dan `product_category` terkait untuk dimasukkan ke objek respons. Jika tidak ada, set `status: "unknown_type"` dan `message: "Item code '...' belum ada mapping"`.
   - Cari data di tabel `product` berdasarkan `serialNumber`. Jika nomor seri sudah terdaftar di sistem, set `status: "duplicate"` dan `message: "SN sudah ada di sistem"`.
   - Jika lolos semua pengecekan, set `status: "valid"`.
4. Kembalikan respons berupa array JSON berformat `PreviewRow[]` (Poin 2) agar bisa langsung dibaca oleh state tabel frontend.

### Tahap B: Sinkronisasi Frontend UI

1. Buka komponen frontend tempat form multi-step upload Accurate berada.
2. Cari fungsi _handler_ unggah file (tempat data dummy `MOCK_PREVIEW` dimasukkan ke dalam state).
3. **Hanya ubah logika di dalam fungsi tersebut:** Jalankan fungsi parser lokal dari `src/lib/accurate-parser.ts`, fetch hasilnya ke API `/api/v1/upload/validate` yang baru dibuat menggunakan `apiFetch`, lalu masukkan array respons `PreviewRow[]` ke dalam state preview UI yang sudah ada tanpa merusak visual halaman.
