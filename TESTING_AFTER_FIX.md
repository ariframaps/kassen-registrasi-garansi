# Testing Guide After Bug Fix

## 🐛 What Was Fixed

**Bug**: "Upload gagal - Destination label diperlukan" error after creating item codes  
**Fix**: Preserve destination selection (`destType` + `destLabel`) when re-processing file

---

## ✅ Test Steps (Follow Exactly)

### Step 1: Upload File
```
1. Open: http://localhost:3000/dashboard/upload
2. Upload file with unknown item codes
   (or use mock data: Already has POS-3453MFH)
```

### Step 2: Start Process
```
3. Click "Mulai Proses" button
4. Wait for validation to complete
```

### Step 3: Select Destination ⭐ IMPORTANT
```
5. In preview section, look for:
   "Tujuan produk ini:"
   [Dealer] [End Customer]
   
6. Click "Dealer" button (MUST SELECT BEFORE CREATING CODES)
7. Modal appears: Select dealer or create new
   - Pick existing dealer: "PT Maju Teknologi"
   - Or click "Buat dealer baru"
8. Dealer selection confirmed, you should see:
   ✓ Dealer: PT Maju Teknologi
```

### Step 4: See Unknown Items Warning
```
9. Scroll down to see warning:
   "⚠️ Ada 1 item code yang belum dikenali"
   [Buat Item Code] button visible
```

### Step 5: Create Item Codes
```
10. Click [Buat Item Code] button
11. Modal opens: "Buat Item Code Baru"
12. Fill form:
    - Nama Tipe Produk: "POS Terminal Pro Max"
    - Kategori: Select from dropdown
    - Garansi: Keep 12
13. Click [Buat 1 Item Code]
14. Wait for success toast
15. Modal closes, preview refreshes automatically
```

### Step 6: Verify Destination Preserved ✅
```
16. After item codes created, check:
    ✓ Preview updated (unknown → valid)
    ✓ Destination STILL shows: "✓ Dealer: PT Maju Teknologi"
    
    If destination disappeared → Bug not fixed!
    If destination preserved → Bug is fixed! ✓
```

### Step 7: Submit File
```
17. Click [Submit File Ini (1 produk)]
18. Wait for submission to complete
19. Success! File uploaded
    Toast: "File berhasil diupload"
    
    If error: "Destination label diperlukan" → Bug still exists
    If success → Bug is fixed! ✓
```

---

## 🎯 Expected Behavior After Fix

### Before Creating Item Codes
```
┌─ Tujuan produk ini: ─────────────────────┐
│ [✓ Dealer] [End Customer]                │
│                                           │
│ ✓ Dealer: PT Maju Teknologi              │
│   (shown after selecting dealer)          │
└───────────────────────────────────────────┘

┌─ Unknown Items Warning ──────────────────┐
│ ⚠️ Ada 1 item code yang belum dikenali    │
│ [Buat Item Code] button ← Click here     │
└───────────────────────────────────────────┘
```

### After Creating Item Codes (THE FIX)
```
✅ BEFORE FIX (Bug):
   Destination: [LOST] ❌
   Preview: Refreshed but destination gone
   Result: Submit fails with "Destination label required"

✅ AFTER FIX (Working):
   Destination: "✓ Dealer: PT Maju Teknologi" ✓
   Preview: Refreshed AND destination preserved
   Result: Submit works successfully!
```

---

## 🧪 Test Scenarios

### Scenario A: Dealer with Single Code
```
1. Select Dealer destination ✓
2. Create 1 item code
3. After modal closes:
   - Destination shows? YES ✓
   - Preview updated? YES ✓
4. Submit file
5. Success? YES ✓ (Bug fixed)
```

### Scenario B: Customer with Multiple Codes
```
1. Select End Customer
2. Enter custom name: "Toko ABC"
3. Create 3 item codes
4. After modal closes:
   - Destination shows "Toko ABC"? YES ✓
   - Preview updated? YES ✓
5. Submit file
6. Success? YES ✓ (Bug fixed)
```

### Scenario C: Dealer with Fuzzy Selection
```
1. Click Dealer
2. Modal shows fuzzy match suggestions
3. Select: "PT Maju Teknologi"
4. See confirmation: "✓ Dealer: PT Maju Teknologi"
5. Create item codes
6. After creation:
   - Destination still shows? YES ✓
7. Submit
8. Success? YES ✓
```

---

## 🔍 How to Verify the Fix in Browser

### Step 1: Open Browser Console (F12)
```
Look for these in the Network tab:
- POST /api/v1/product-types (creating item codes)
- POST /api/v1/upload/validate (re-validating file)
- POST /api/upload (final submission)

All should return 200/201 ✓
```

### Step 2: Check React DevTools
```
QueueFile state should show:
{
  id: "qf_...",
  file: File,
  state: "previewing",
  destType: "dealer",        ← Should be preserved!
  destLabel: "PT Maju...",   ← Should be preserved!
  preview: [...],
  validCount: 1,
  unknownCount: 0            ← Now 0 (all created)
}
```

### Step 3: Check for Errors
```
Console should show:
- No red error messages
- Only normal logs
- No "Destination label" errors when submitting
```

---

## ✅ Checklist

Before submitting, verify:

- [ ] File uploaded successfully
- [ ] "Mulai Proses" completed
- [ ] Destination selected and showing ✓
- [ ] Unknown codes warning appeared
- [ ] "Buat Item Code" button visible and clicked
- [ ] Modal form filled and submitted
- [ ] Success toast appeared
- [ ] Modal closed automatically
- [ ] Preview refreshed
- [ ] **Destination STILL shows after refresh** ← THE FIX
- [ ] Submit button is enabled
- [ ] File submitted successfully
- [ ] Final success toast showed

All checked? 🎉 **Bug is fixed!**

---

## 🚨 If You Still Get Error

If you still see "Destination label diperlukan" error:

1. **Check Browser Console (F12)**
   - Any JavaScript errors?
   - Any API errors in Network tab?

2. **Check Destination Status**
   - Does destination show after item code creation?
   - Or is it blank/missing?

3. **Try These Steps**
   - Refresh page
   - Clear browser cache (Ctrl+Shift+Delete)
   - Make sure dev server reloaded the changes
   - Check: Is code file saved? (CTRL+S in IDE)

4. **If Still Failing**
   - Report with:
     - Browser console screenshot
     - Network tab screenshot
     - Steps you took

---

## 📊 Success Criteria

| Test | Expected | Result |
|------|----------|--------|
| Select destination | Shows selected value | ✓ or ❌ |
| Create item codes | Modal creates items | ✓ or ❌ |
| After creation | Destination preserved | ✓ or ❌ |
| Submit file | No error, success toast | ✓ or ❌ |

**All ✓ = Bug Fixed!**

---

## 🎯 TL;DR - Quick Test

```bash
1. Upload file → [Mulai Proses]
2. Select Dealer → [PT Maju Teknologi]
3. Click [Buat Item Code]
4. Fill form → [Buat 1 Item Code]
5. Check: Dealer still shows? ✓
6. Click [Submit File]
7. Success? = Bug Fixed! ✓
   Error? = Bug exists ❌
```

---

**Test Duration**: 3-5 minutes  
**Difficulty**: Easy  
**Expected Result**: Success ✅

Good luck! 🚀
