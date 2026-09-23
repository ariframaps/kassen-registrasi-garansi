# Testing: Bulk Create Item Codes Feature

## Overview
Fitur untuk bulk create unknown item codes yang ditemukan saat upload file Excel dari Accurate.

## Manual Test Steps

### Step 1: Navigate to Upload Page
- Buka: `http://localhost:3000/dashboard/upload`
- Pastikan sudah login sebagai admin atau sales

### Step 2: Trigger Unknown Item Codes Warning
- Upload file Excel dengan item codes yang belum ada di sistem
- Atau gunakan mock data yang sudah ada (MOCK_PREVIEW memiliki item code 'POS-3453MFH' yang unknown)
- Klik "Mulai Proses"

### Step 3: Review Preview
- Preview akan menunjukkan:
  - ✓ Valid items (sudah ada mapping)
  - ⚠️ Duplicate items (SN sudah ada)
  - ❌ Unknown items (item code belum ada mapping)

### Step 4: Open Create Item Codes Modal
- Lihat warning box: "Ada [X] item code yang belum dikenali"
- Klik tombol **"Buat Item Code"** (tombol baru di sebelah kanan warning)

### Step 5: Fill Form
Modal akan menampilkan form untuk setiap unknown item code:
- **Item Code**: Display only (contoh: POS-3453MFH)
- **Nama Tipe Produk**: Isi nama produk baru (wajib)
- **Kategori**: Pilih dari dropdown (wajib)
- **Garansi (bulan)**: Default 12 bulan (opsional)

Contoh pengisian:
```
Item Code: POS-3453MFH (5 unit)
Nama Tipe Produk: POS Terminal Pro Max
Kategori: POS System
Garansi: 12 bulan
```

### Step 6: Submit
- Klik tombol **"Buat [X] Item Code"**
- Loading indicator akan muncul dengan text "Menyimpan..."
- Success toast akan muncul: "Berhasil - X item code baru telah ditambahkan ke sistem"

### Step 7: Verify Auto-Refresh
- Modal otomatis menutup
- Preview di-refresh otomatis
- Unknown items yang sebelumnya akan berubah menjadi valid items
- User bisa langsung lanjut submit file tanpa perlu ulang

## Test Cases

### TC-1: Single Unknown Item Code
**Input**: File dengan 1 unknown item code
**Expected**: 
- Modal menampilkan 1 form
- Button text: "Buat 1 Item Code"
- Semua field bisa diisi

### TC-2: Multiple Unknown Item Codes (5+)
**Input**: File dengan 5+ unknown item codes
**Expected**:
- Modal scrollable dengan max-height 396px
- Semua forms visible saat di-scroll
- Button text: "Buat [5+] Item Code"
- Batch create dengan Promise.all() untuk performance

### TC-3: Bulk Unknown (100+ items)
**Input**: File dengan 100+ unknown item codes
**Expected**:
- Form tetap responsive
- Scroll smooth
- All items created successfully
- Toast menunjukkan jumlah exact yang dibuat

### TC-4: Validation
**Input**: Submit form dengan field kosong
**Expected**:
- Toast error: "Validasi - Harap lengkapi semua nama produk dan kategori"
- Loading button disabled

### TC-5: API Error Handling
**Input**: Network error saat create
**Expected**:
- Toast error dengan pesan error dari API
- Loading state berhenti
- User bisa retry

## Expected Behavior

### Before Click "Buat Item Code"
```
├─ Warning Box
│  ├─ Icon: AlertTriangle
│  ├─ Text: "Ada X item code yang belum dikenali"
│  └─ Button: "Buat Item Code"
├─ Preview Table (dengan unknown items highlighted)
└─ Cannot submit until items created or skipped
```

### During Create
```
Modal
├─ Title: "Buat Item Code Baru"
├─ Form Items (scrollable)
│  ├─ Item Code: POS-3453MFH (5 unit)
│  ├─ Input: Nama Tipe Produk
│  ├─ Select: Kategori
│  └─ Input: Garansi (bulan)
├─ Footer
│  ├─ Button: "Batal" (enabled)
│  └─ Button: "Buat 1 Item Code" → "Menyimpan..." (spinning icon)
└─ Overlay: Semi-transparent
```

### After Create Success
```
✓ Success Toast: "Berhasil - 1 item code baru telah ditambahkan ke sistem"
✓ Modal closes automatically
✓ Preview refreshes
✓ Previously unknown items are now valid
✓ File ready to submit
```

## API Calls

### 1. Load Categories (when modal opens)
```
GET /api/v1/product-categories
Response: CategorySchema[]
```

### 2. Create Product Types (bulk)
```
POST /api/v1/product-types
Body: {
  name: "POS Terminal Pro Max",
  categoryId: "cat-123",
  itemCodes: ["POS-3453MFH"]
}
Response: ProductTypeWithNestedSchema
```

Dijalankan dengan `Promise.all()` untuk semua item codes sekaligus.

## Performance Considerations

- Modal scrollable untuk 1000+ items
- Batch create dengan Promise.all() untuk efficiency
- No N+1 queries
- Categories loaded once saat modal dibuka
- State management optimized dengan map operations

## Edge Cases

1. **No Categories**: Dropdown empty, form validation will prevent submit
2. **Duplicate Product Type Name**: API will reject, toast error shown
3. **Network Error During Create**: Graceful error handling, user can retry
4. **User Closes Modal**: State reset, can open again
5. **Mixed Unknown + Valid Items**: Only unknown items shown in modal

## Browser DevTools Testing

### Check Console
```javascript
// Verify extractUnknownCodes function
unknownCodes = [
  { code: "POS-3453MFH", count: 5 },
  { code: "KDS-1234", count: 3 }
]

// Check form state
forms = [
  { 
    code: "POS-3453MFH",
    productTypeName: "",
    categoryId: "",
    warrantyDurationMonths: 12
  }
]
```

### Check Network Tab
- GET /api/v1/product-categories (categories dropdown)
- POST /api/v1/product-types x N (create each item code)

## Accessibility

- Form labels properly associated
- Select dropdown keyboard navigable
- Loading state indicated with spinner
- Error messages shown in toast
- Modal can be closed with Escape key
