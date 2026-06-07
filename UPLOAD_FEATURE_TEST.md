# Upload Feature - Testing Guide

## 📋 Feature Overview
Halaman upload sekarang sudah fully integrated dengan backend untuk:
- Parse file Excel Accurate
- Validate data dengan database (cek duplicate serial, product type mapping)
- Save delivery order + products ke database
- Show real preview (bukan mock data lagi)

## 🧪 Testing Checklist

### Prerequisites
- [ ] Dev server running (`npm run dev`)
- [ ] Halaman accessible: http://localhost:3000/dashboard/upload
- [ ] Logged in as user dengan role `admin` atau `sales`
- [ ] Sample Excel file dari Accurate (atau use test file di bawah)

### Test 1: File Upload & Preview ✅
**Goal**: Upload file → validate → show preview dari backend

1. **Prepare test file** (gunakan sample Accurate export)
   - File harus `.xlsx` atau `.xls`
   - Contains: Ship To, Date, Item Code, Serial Numbers

2. **Upload file**
   - [ ] Drag & drop file ke drop zone
   - [ ] OR klik untuk browse file
   - [ ] File masuk queue dengan status "pending"

3. **Process file**
   - [ ] Klik "Mulai Proses" button
   - [ ] Status berubah menjadi "processing" (loading spinner)
   - [ ] Backend call `/upload/validate` API
   - [ ] After ~2-3 detik, status jadi "previewing"
   - [ ] ⭐ **Preview menampilkan items dari file** (BUKAN mock data)

4. **Verify preview accuracy**
   - [ ] Valid items: Serial numbers + Product Type + Category tampil
   - [ ] Duplicate items: Mark dengan "Duplikat" badge (jika SN sudah ada di DB)
   - [ ] Unknown items: Mark dengan warning (jika item code belum ada mapping)
   - [ ] Count badges: "3 valid", "1 duplikat", "2 item code tidak dikenal" dll

### Test 2: Destination Selection ✅
**Goal**: User memilih tujuan (dealer/customer)

1. **After preview loaded**
   - [ ] Ada 2 button: "Dealer" dan "End Customer"
   - [ ] Click pada "Dealer"
   - [ ] Modal muncul: "Konfirmasi Dealer"
   - [ ] List mock dealers dengan score (ini MOCK, production perlu real data)

2. **Select dealer**
   - [ ] Click dealer dengan "Sangat Cocok" badge
   - [ ] Modal tutup
   - [ ] Destination label tampil: "Dealer: [nama dealer]"

### Test 3: File Submit ✅
**Goal**: Submit file → save ke database

1. **Submit file**
   - [ ] Click "Submit File Ini (X produk)" button
   - [ ] Status berubah "submitting" dengan loading spinner
   - [ ] Backend call `/upload` API

2. **Success response**
   - [ ] Status berubah "done" dengan ✓ checkmark
   - [ ] Toast notification: "File berhasil diupload - X produk ditambahkan"
   - [ ] Queue maju ke file berikutnya (auto-process)

3. **Verify database**
   - [ ] Check `delivery_order` table:
     ```sql
     SELECT * FROM delivery_order 
     ORDER BY created_at DESC LIMIT 1;
     ```
     - doNumber, doDate, shipToRaw, destinationType (dealer/customer)
     - fileHash (unique, prevent duplicate upload)
     - originalFilename
   
   - [ ] Check `product` table:
     ```sql
     SELECT * FROM product 
     WHERE delivery_order_id = '[DO_ID]'
     ORDER BY created_at DESC;
     ```
     - serialNumber, productTypeId, deliveryOrderId
     - dealerId (should match if destination=dealer)
     - status='none' (default)

### Test 4: Error Handling ✅
**Goal**: Verify error cases handled gracefully

#### 4a: Duplicate file upload
1. Upload same file again
2. Should show error: "File ini sudah pernah diupload sebelumnya"
3. Status: "error"

#### 4b: Unknown item code
1. Upload file dengan item code yang belum ada mapping
2. Preview shows: "unknown_type" status dengan message
3. Item diperhitungkan di unknown count
4. ⚠️ Item TIDAK bisa di-submit (hanya valid items)

#### 4c: Duplicate serial number
1. If serial number sudah ada di DB dari upload sebelumnya
2. Preview shows: "duplicate" status
3. Item diperhitungkan di duplicate count
4. ⚠️ Item TIDAK disimpan (skip)

### Test 5: Multi-file Queue ✅
**Goal**: Upload multiple files sequentially

1. Upload 3 files sekaligus
2. Files masuk queue dengan index (1, 2, 3)
3. File #1 auto-process → preview → user submit
4. Setelah file #1 done, file #2 auto-process
5. Progress bar update: "1 dari 3 file selesai"
6. After semua done: Summary "Semua file selesai diproses!"

## 🔍 Code Structure

### Backend
- **Parser** (`src/lib/parser-accurate.ts`)
  - `parseExcelFile()`: Read & parse Excel
  - `validateAndPreview()`: Validate & return preview data

- **Service** (`src/services/accurate.service.ts`)
  - `getProductTypeMappings()`: Load item code → product type mapping
  - `getExistingSerialNumbers()`: Load existing SNs from DB
  - `validateAccurateFile()`: Call parser + validator
  - `submitAccurateFile()`: Save DO + products to DB

- **Routes**
  - `POST /api/v1/upload/validate`: Preview (no save)
  - `POST /api/v1/upload`: Submit & save

### Frontend
- **Page** (`src/app/(protected)/dashboard/upload/page.tsx`)
  - `processFile()`: Call validate API → update preview
  - `submitFile()`: Call upload API → save to queue
  - Queue management: `QueueFile` state tracking

## 📊 Expected Data Flow

```
User Upload Excel
    ↓
Frontend validates format (.xlsx/.xls)
    ↓
Frontend calls /upload/validate
    ↓
Backend:
  1. Parse Excel file
  2. Load product type mappings
  3. Load existing serial numbers
  4. Validate each item:
     - Check if SN duplicate → status "duplicate"
     - Check if item code has mapping → status "valid"
     - Else → status "unknown_type"
  5. Return preview with counts
    ↓
Frontend shows preview
    ↓
User selects destination (dealer/customer)
    ↓
User clicks Submit
    ↓
Frontend calls /upload with destination
    ↓
Backend:
  1. Re-validate file (security)
  2. Create delivery_order record
  3. Create product records (only valid items)
  4. Return DO number + count
    ↓
Frontend shows success
    ↓
Process next file in queue
```

## ⚠️ Known Limitations / TODO

1. **Fuzzy Dealer Matching**: Using MOCK_DEALERS
   - Production: Need real dealer lookup API
   - New dealer creation: Dialog exists but no API call

2. **Date Format**: 
   - Excel dates convert to ISO format
   - Fallback to today if parsing fails

3. **Product Type Mapping**:
   - Must exist in DB before upload
   - Add mapping: `/dashboard/product-types` page

4. **Serial Number Validation**:
   - Must match regex: `^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{8,}$`
   - Example valid: `SN12345678`, `AC1234XYZR`
   - Example invalid: `12345678` (no letters), `abc` (too short)

## 🚀 Success Criteria

✅ All tests pass:
- [ ] File upload works
- [ ] Preview shows real data (not mock)
- [ ] Validation catches duplicates & unknown items
- [ ] File submit saves to database
- [ ] Error handling works
- [ ] Multi-file queue works
- [ ] Database records created correctly

Once all tests pass, feature is ready for production! 🎉
