# Quick Start - Upload Feature Testing

## 🚀 Start Here

### Step 1: Ensure Dev Server Running
```bash
npm run dev
# Should output: Local: http://localhost:3000
```

### Step 2: Open Upload Page
```
http://localhost:3000/dashboard/upload
```

### Step 3: Test Upload (Choose One)

#### Option A: Use Real Accurate Excel File
1. Export delivery order from Accurate
2. Download file (.xlsx format)
3. Upload to page

#### Option B: Use Sample Test File
Create `test-delivery.xlsx` with columns:
```
Ship To | (empty) | (empty) | (empty) | (empty) | (empty) | (empty) | Description | ... | Item Code | Qty | Unit | ... | SerialNumbers
--------|---------|---------|---------|---------|---------|---------|-------------|-----|-----------|-----|------|-----|----------------
PT ABC  | (empty) | (empty) | (empty) | (empty) | (empty) | (empty) | (empty)     | ... | POS-001   | 2   | Unit | ... | SN12345678
        | (empty) | (empty) | (empty) | (empty) | (empty) | (empty) | (empty)     | ... | KDS-002   | 1   | Unit | ... | SN87654321AB
```

### Step 4: What to Expect

#### ✅ Good Flow
```
1. File uploaded → status "pending"
2. Click "Mulai Proses" 
3. Status becomes "processing" (loading)
4. After 2-3 sec → status "previewing"
5. See preview table dengan real items dari file
6. Select "Dealer" atau "Customer"
7. Click "Submit File Ini (X produk)"
8. Status "submitting" → "done"
9. Toast: "File berhasil diupload - X produk ditambahkan"
```

#### ❌ Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Preview shows mock data | Validate API not called | Check console for errors |
| "Dealer tidak ditemukan" | Dealer name mismatch | Edit MOCK_DEALERS or use "Buat dealer baru" |
| "Item code belum ada mapping" | Unknown item code | Go to /dashboard/product-types and add mapping |
| File rejected immediately | Wrong format (.csv, .txt) | Use .xlsx or .xls format |
| Upload fails after preview | DB error | Check database connection, roles |

### Step 5: Verify in Database

After successful upload, check:

```sql
-- Check delivery order was created
SELECT do_number, ship_to_raw, destination_type, file_hash 
FROM delivery_order 
ORDER BY created_at DESC LIMIT 1;

-- Check products were created
SELECT serial_number, product_type_id, delivery_order_id, status 
FROM product 
WHERE delivery_order_id = '[from query above]'
LIMIT 5;
```

---

## 🔍 Browser Console Debugging

Press `F12` to open Developer Tools

### Check API Calls
1. Go to **Network** tab
2. Upload file
3. Look for requests:
   - `POST /api/v1/upload/validate` → should be 200 OK
   - `POST /api/v1/upload` → should be 201 Created

### Check Errors
1. Go to **Console** tab
2. Look for red error messages
3. Common errors:
   - `401 Unauthorized` → Need to login first
   - `403 Forbidden` → Need admin/sales role
   - `400 Bad Request` → Check request data

### Check State
1. Open **Console** tab
2. Type: `console.log(localStorage)`
3. Should see session token

---

## 📋 Feature Checklist

### Basic Upload ✅
- [ ] File drop works
- [ ] File browser works
- [ ] File status updates correctly
- [ ] Preview loads without mock data

### Validation ✅
- [ ] Preview shows real items from file
- [ ] Duplicates marked correctly
- [ ] Unknown items marked correctly
- [ ] Counts are accurate (X valid, Y dup, Z unknown)

### Submission ✅
- [ ] Destination selection works
- [ ] Submit button enabled only when destination selected
- [ ] Upload API called with correct data
- [ ] Database records created

### Error Handling ✅
- [ ] Invalid file rejected (non-Excel)
- [ ] Duplicate file rejected (same file hash)
- [ ] Network error shown as toast
- [ ] Server error shown as toast

### Queue ✅
- [ ] Multiple files upload sequentially
- [ ] Progress bar updates
- [ ] Final summary shows total count

---

## 🎯 Success Criteria

✅ **All tests pass** when:
1. File upload works end-to-end
2. Preview shows REAL data (not mock)
3. Database has new delivery_order
4. Database has new product records
5. No console errors
6. Proper error messages for failures

---

## 💡 Tips

**Fastest Test:**
```
1. Have an Excel file ready
2. Login as admin
3. Go to /dashboard/upload
4. Upload file
5. Check database immediately after success
```

**Test Duplicate:**
```
1. Upload file successfully
2. Try upload same file again
3. Should show error: "File ini sudah pernah diupload"
```

**Test Unknown Item:**
```
1. Add item code yang belum ada mapping di file
2. Upload file
3. Preview should show "unknown_type" for that item
4. Count should show in "unknownCount"
```

---

## 📞 Troubleshooting

If something doesn't work:

1. **Check dev server logs** (terminal where you ran `npm run dev`)
2. **Check browser console** (F12 → Console)
3. **Check Network tab** (F12 → Network) for failed requests
4. **Check database** (adminer/psql) for created records
5. **Review error message** in toast notification

Common culprits:
- ❌ Not logged in
- ❌ User role not admin/sales
- ❌ Item code mapping not in database
- ❌ Dealer name doesn't exist in MOCK_DEALERS
- ❌ Excel file format wrong (.csv instead of .xlsx)

---

**Happy Testing! 🎉**
