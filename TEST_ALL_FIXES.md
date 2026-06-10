# 🧪 Test All Fixes - Step by Step

**Duration**: 5-10 minutes  
**Expected**: All scenarios pass ✅

---

## Test 1: End Customer (Previously Failed ❌)

### Steps
```
1. Open: http://localhost:3000/dashboard/upload
2. Upload any file OR use mock data
3. Click "Mulai Proses"
4. In preview, look for:
   "Tujuan produk ini:"
   [Dealer] [End Customer] ← Click this
5. **Expected**: Modal appears asking for customer name ✓
6. Enter: "Toko ABC"
7. Click "Simpan"
8. **Expected**: See confirmation:
   "✓ Toko ABC" ✓
9. Create item codes (if any) or just submit
10. Click "Submit File Ini"
11. **Expected**: SUCCESS (no error) ✓
```

### Success Criteria
- ✅ Modal appears when "End Customer" clicked
- ✅ Can enter customer name
- ✅ Name saved and displayed
- ✅ File submits without "Destination label" error

---

## Test 2: Dealer Fuzzy Matching (Previously Used Mock ❌)

### Steps
```
1. Open upload page
2. Upload file OR use mock data
3. Click "Mulai Proses"
4. In preview, select:
   "Tujuan produk ini:"
   [Dealer] ← Click this
5. **Expected**: Modal shows dealers from DATABASE ✓
   (NOT hardcoded mock dealers)
6. **Expected**: Dealers fuzzy-matched with Ship To ✓
   File has: Ship To = "PT Maju Teknologi"
   Modal shows: 
   - PT Maju Teknologi: [Cocok] (best match)
   - Other dealers below (lower matches)
7. Click best match: "PT Maju Teknologi"
8. **Expected**: Dealer saved ✓
9. Create item codes (if any) or just submit
10. Click "Submit File Ini"
11. **Expected**: SUCCESS (dealer found) ✓
```

### Success Criteria
- ✅ Real dealers loaded from API (not mock)
- ✅ Fuzzy matching works
- ✅ Best matches shown first
- ✅ File submits without "dealer tidak ditemukan" error

---

## Test 3: Full Flow - Item Codes + Destination

### Steps (End Customer)
```
1. Upload file with unknown item codes
2. Click "Mulai Proses"
3. Select "End Customer"
4. Modal: Enter "Toko XYZ" → Simpan
5. See warning: "Ada X item code tidak dikenali"
6. Click "Buat Item Code"
7. Fill forms → "Buat X Item Code"
8. After modal closes:
   - Check: Item codes created? ✓
   - Check: Destination still shows "Toko XYZ"? ✓
9. Click "Submit File Ini"
10. **Expected**: SUCCESS ✓
```

### Steps (Dealer)
```
1. Upload file with unknown item codes
2. Click "Mulai Proses"
3. Select "Dealer"
4. Modal: Pick real dealer (e.g., "PT Maju Teknologi")
5. See warning: "Ada X item code tidak dikenali"
6. Click "Buat Item Code"
7. Fill forms → "Buat X Item Code"
8. After modal closes:
   - Check: Item codes created? ✓
   - Check: Destination still shows dealer name? ✓
9. Click "Submit File Ini"
10. **Expected**: SUCCESS ✓
```

---

## 🔍 What to Check

### For End Customer
- [ ] Modal appears on click
- [ ] Can type customer name
- [ ] Name saved in UI
- [ ] Shows in confirmation box
- [ ] Submit works without errors
- [ ] No "Destination label required" error

### For Dealer Fuzzy Matching
- [ ] Modal shows real dealers (from API)
- [ ] Dealers scored/matched
- [ ] Ship To matching works
- [ ] Best matches first
- [ ] Can select from list
- [ ] Submit works without errors
- [ ] No "dealer tidak ditemukan" error

### For Item Code Creation
- [ ] Modal opens on "Buat Item Code" button
- [ ] Form appears
- [ ] After creation, destination preserved
- [ ] Preview updates
- [ ] File can be submitted

---

## 🎯 Expected Results

### Scenario 1: End Customer Only
```
Upload → Select End Customer → Enter name → Submit
Result: ✅ SUCCESS
```

### Scenario 2: Dealer Only
```
Upload → Select Dealer → Pick from fuzzy matched list → Submit
Result: ✅ SUCCESS
```

### Scenario 3: With Item Codes (End Customer)
```
Upload → Select End Customer → Enter name → Create item codes → Submit
Result: ✅ SUCCESS
```

### Scenario 4: With Item Codes (Dealer)
```
Upload → Select Dealer → Pick from fuzzy list → Create item codes → Submit
Result: ✅ SUCCESS
```

---

## 🔧 Troubleshooting

### If End Customer modal doesn't appear
- [ ] Check browser console (F12) for errors
- [ ] Make sure you clicked "End Customer" button
- [ ] Try refreshing page

### If Dealer modal shows mock dealers (not real)
- [ ] Check network tab - is GET /dealers called?
- [ ] If not called, dev server might not recompiled
- [ ] Try hard refresh (Ctrl+Shift+R)

### If Submit fails with "dealer tidak ditemukan"
- [ ] Check if dealer actually exists in database
- [ ] Should be real dealers from API (not mock)
- [ ] Try creating new dealer via modal

### If Item codes don't persist after creation
- [ ] Check destination preserved after modal closes
- [ ] Should show ✓ Dealer/Customer name still
- [ ] Check browser console for errors

---

## 📊 Quick Checklist

| Test | Expected | Status |
|------|----------|--------|
| End Customer modal | Shows on click | ✓ or ✗ |
| Customer name input | Can type name | ✓ or ✗ |
| Dealer fuzzy search | Shows real dealers | ✓ or ✗ |
| Best match first | PT Maju first | ✓ or ✗ |
| Item code creation | Modal works | ✓ or ✗ |
| Destination preserved | Still shows after | ✓ or ✗ |
| Submit success | No errors | ✓ or ✗ |

**All ✓ = ALL FIXES WORKING!** 🎉

---

## 🚀 If All Tests Pass

✅ End Customer: Fixed  
✅ Dealer Fuzzy Matching: Fixed  
✅ Dealer Not Found: Fixed  
✅ Item Code + Destination: Fixed  

**Ready for production!** 🚀

---

**Test Time**: ~5-10 minutes  
**Difficulty**: Easy  
**Expected Result**: All pass ✅
