# Fitur Dealer Tahap 1 - Dokumentasi

## Overview
Implementasi fitur Dealer Tahap 1 mencakup tiga fitur utama:
1. **Halaman Produk Dealer** - Menampilkan produk dealer dengan search, filter, dan pagination
2. **Halaman Customer Dealer** - Menampilkan daftar customer dealer dengan search
3. **Halaman Purchases Dealer** - Menampilkan riwayat pembelian customer dengan detail lengkap

## Backend API Endpoints

### 1. GET `/api/v1/dealers/:dealerId/products`
**Deskripsi**: Mengambil daftar produk milik dealer dengan pagination, search, dan filter

**Query Parameters**:
- `page` (number): Halaman saat ini (default: 1)
- `pageSize` (number): Jumlah item per halaman (default: 20, max: 100)
- `search` (string): Pencarian berdasarkan serial number atau tipe produk
- `categoryId` (string): Filter kategori produk (opsional)

**Response**:
```json
{
  "success": true,
  "message": "Produk dealer berhasil diambil",
  "data": {
    "items": [
      {
        "id": "uuid",
        "serialNumber": "SN-001",
        "productType": "Type A",
        "productCategory": "Category A",
        "warrantyStatus": "active|expired|none",
        "customerName": null,
        "warrantyStartDate": "2024-01-01",
        "warrantyEndDate": "2025-01-01"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

**Audit Log**: Mencatat akses dengan event `VIEW_DEALER_PRODUCTS`

---

### 2. GET `/api/v1/dealers/:dealerId/customers`
**Deskripsi**: Mengambil daftar customer yang terkait dengan pembelian dealer

**Query Parameters**:
- `search` (string): Pencarian berdasarkan nama, email, atau nomor telepon customer

**Response**:
```json
{
  "success": true,
  "message": "Customer dealer berhasil diambil",
  "data": [
    {
      "id": "uuid",
      "name": "Nama Customer",
      "email": "customer@email.com",
      "phone": "082xxxxxxxxx"
    }
  ]
}
```

**Audit Log**: Mencatat akses dengan event `VIEW_DEALER_CUSTOMERS`

---

### 3. GET `/api/v1/dealers/:dealerId/purchases`
**Deskripsi**: Mengambil riwayat pembelian dealer beserta detail lengkap

**Response**:
```json
{
  "success": true,
  "message": "Pembelian dealer berhasil diambil",
  "data": [
    {
      "id": "uuid",
      "customerProfile": {
        "id": "uuid",
        "name": "Nama Customer",
        "email": "customer@email.com",
        "phone": "082xxxxxxxxx",
        "address": "Alamat customer"
      },
      "purchaseDate": "2024-01-01",
      "warrantyEndDate": "2025-01-01",
      "items": [
        {
          "productId": "uuid",
          "serialNumber": "SN-001",
          "productType": "Type A",
          "productCategory": "Category A",
          "warrantyStartDate": "2024-01-01",
          "warrantyEndDate": "2025-01-01",
          "warrantyStatus": "active|expired|none",
          "warrantyCondition": "valid|rejected|null"
        }
      ],
      "invoiceFile": "filename.pdf",
      "totalProducts": 5
    }
  ]
}
```

**Audit Log**: Mencatat akses dengan event `VIEW_DEALER_PURCHASES`

---

## Frontend Integration

### API Client Functions (lib/api/api-client.ts)

#### `dealerApi.getProducts()`
```typescript
const response = await dealerApi.getProducts({
  dealerId: "d1",
  page: 1,
  pageSize: 20,
  search: "SN-001",
  categoryId: "cat-123"
});

if (response.success) {
  console.log(response.data.items);
}
```

#### `dealerApi.getCustomers()`
```typescript
const response = await dealerApi.getCustomers({
  dealerId: "d1",
  search: "John"
});

if (response.success) {
  console.log(response.data);
}
```

#### `dealerApi.getPurchases()`
```typescript
const response = await dealerApi.getPurchases("d1");

if (response.success) {
  console.log(response.data);
}
```

---

## Halaman yang Diupdate

### 1. Dashboard Dealer (`/dealer/dashboard`)
**File**: `src/app/(protected)/dealer/dashboard/page.tsx`

**Perubahan**:
- Menghubungkan `loadProducts()` ke API backend
- Menggunakan response structure dari API
- Menampilkan products dengan filter dan pagination dari data API

**State Management**:
- `products`: Array produk dari API
- `loadingProducts`: Loading state
- `page`, `pageSize`: Pagination
- `search`: Pencarian
- `filter`: Filter warranty status

---

### 2. Purchases Dealer (`/dealer/purchases`)
**File**: `src/app/(protected)/dealer/purchases/page.tsx`

**Perubahan**:
- Mengintegrasikan `dealerApi.getPurchases()` pada mount
- Menampilkan data dari API bukan mock data
- Update summary cards untuk menghitung berdasarkan data API
- Detail modal menampilkan data dari API

**State Management**:
- `purchases`: Array pembelian dari API
- `loading`: Loading state
- `filtered`: Hasil filter berdasarkan search dan date range

---

## Audit Log

Semua akses ke fitur dealer dicatat dalam tabel `audit_log` dengan struktur:

```typescript
{
  id: crypto.randomUUID(),
  userId: "user_id",
  category: "DEALER",
  event: "VIEW_DEALER_PRODUCTS|VIEW_DEALER_CUSTOMERS|VIEW_DEALER_PURCHASES",
  status: "success",
  priority: "low",
  data: {
    dealerId: "d1",
    searchQuery?: "search_term",
    categoryFilter?: "category_id",
    itemCount?: 50
  }
}
```

---

## Error Handling

Semua endpoint menggunakan struktur error handling yang sama:

```typescript
if (!response.success) {
  console.error(response.message);
  // Handle error
}
```

---

## Testing

### Cara Test API
1. Login sebagai dealer (demo dealer ID: `d1`)
2. Kunjungi `/dealer/dashboard` untuk test products API
3. Kunjungi `/dealer/purchases` untuk test purchases API
4. Check audit logs di admin dashboard untuk memverifikasi logging

### Data yang Diharapkan
- Minimal 20 products untuk dealer d1
- Minimal 5 purchases untuk dealer d1
- Customer data terkait dengan purchases

---

## Notes

- API endpoints menggunakan authentication middleware
- Semua query dilakukan dengan dealerId filtering untuk keamanan
- Pagination maksimal pageSize adalah 100 untuk mencegah overload
- Warranty status dihitung berdasarkan warrantyEndDate:
  - `none`: Jika status adalah "none"
  - `active`: Jika warrantyEndDate > hari ini
  - `expired`: Jika warrantyEndDate <= hari ini
