# 🧪 Testing Guide - Dealer Search & Customer Creation

**Duration**: 5-10 minutes  
**Expected**: All features working ✅

---

## Feature 1: Dealer Search

### Test 1a: Search by Name
```
1. Open: http://localhost:3000/dashboard/upload
2. Upload file OR use mock data
3. Click "Mulai Proses"
4. Select "Dealer" button
5. Modal opens with search field ✓
6. Type: "PT Maju"
7. Expected: Shows PT Maju Teknologi (if exists) ✓
8. Click to select
9. Check: "✓ Dealer: PT Maju Teknologi" ✓
10. Submit file
11. Expected: SUCCESS ✓
```

### Test 1b: Search by Email
```
1. Modal open (Dealer)
2. Clear search if needed
3. Type: "contact@" (or any part of email)
4. Expected: Shows dealers with matching email ✓
5. Select one
6. Submit file → SUCCESS ✓
```

### Test 1c: Search by Phone
```
1. Modal open (Dealer)
2. Clear search
3. Type: "08123" (or any part of phone)
4. Expected: Shows dealers with matching phone ✓
5. Select one
6. Submit file → SUCCESS ✓
```

### Test 1d: Fuzzy Match (Default)
```
1. Modal open (Dealer)
2. Don't type anything (leave search blank)
3. Expected: Shows fuzzy-matched dealers ✓
4. Best matches first ✓
5. Shows contact info below name ✓
6. Select one
7. Submit file → SUCCESS ✓
```

### Test 1e: No Results
```
1. Modal open
2. Type: "XXXXXXX" (invalid)
3. Expected: "Tidak ada dealer yang cocok" ✓
4. "Buat dealer baru" button still available ✓
```

---

## Feature 2: End Customer Creation

### Test 2a: Existing Customer
```
1. Open upload page
2. Upload file
3. Click "Mulai Proses"
4. Select "End Customer" button
5. Modal appears ✓
6. Type: name of EXISTING customer
7. Click "Simpan Customer"
8. Expected: Customer saved ✓
9. See: "✓ [Customer Name]" ✓
10. Submit file → SUCCESS ✓
```

### Test 2b: Create New Customer
```
1. Select "End Customer"
2. Modal appears
3. Click "Buat Customer Baru"
4. New customer form opens ✓
5. Fill:
   - Nama: "Toko Baru" (required)
   - Email: "toko@email.com" (optional)
   - Phone: "081234567" (optional)
6. Click "Simpan & Lanjut"
7. Expected: Customer created ✓
8. Back to upload
9. See: "✓ Toko Baru" ✓
10. Submit file → SUCCESS ✓
```

### Test 2c: No "Customer Tidak Ditemukan" Error
```
1. Create new customer with unique name
2. Submit file
3. Expected: SUCCESS (no error) ✓
   Before: "customer tidak ditemukan" ❌
   After: Works! ✅
```

### Test 2d: Optional Fields
```
1. Create new customer
2. Only fill: Nama = "Test Toko"
3. Leave Email & Phone empty
4. Click "Simpan & Lanjut"
5. Expected: WORKS (email/phone optional) ✓
6. Customer created without email ✓
7. Submit file → SUCCESS ✓
```

---

## 🎯 Checklist

### Dealer Search
- [ ] Search field visible
- [ ] Can type in search field
- [ ] Search by name works
- [ ] Search by email works
- [ ] Search by phone works
- [ ] Fuzzy match still works (blank search)
- [ ] Contact info shown
- [ ] "Buat dealer baru" button works
- [ ] Submit succeeds

### End Customer
- [ ] "End Customer" button works
- [ ] Modal opens
- [ ] Can type customer name
- [ ] "Simpan Customer" button works
- [ ] "Buat Customer Baru" button works
- [ ] New customer form appears
- [ ] Can fill name, email, phone
- [ ] "Simpan & Lanjut" works
- [ ] New customer created
- [ ] Submit succeeds (no error)

---

## ✅ Expected Results

### Dealer Search
| Test | Expected | Status |
|------|----------|--------|
| Type in search | Shows results | ✓ or ✗ |
| Search by name | Matches found | ✓ or ✗ |
| Search by email | Matches found | ✓ or ✗ |
| Search by phone | Matches found | ✓ or ✗ |
| Blank search | Fuzzy match | ✓ or ✗ |
| Submit after select | Success | ✓ or ✗ |

### End Customer
| Test | Expected | Status |
|------|----------|--------|
| Click button | Modal opens | ✓ or ✗ |
| Click "Buat Baru" | Form opens | ✓ or ✗ |
| Fill name only | Accepts | ✓ or ✗ |
| Click "Simpan" | Customer saved | ✓ or ✗ |
| Submit file | Success (no error) | ✓ or ✗ |

---

## 🐛 Troubleshooting

### Dealer Search Not Working
- [ ] Check browser console (F12) for errors
- [ ] Make sure dealers loaded from API
- [ ] Try hard refresh (Ctrl+Shift+R)
- [ ] Check network tab - is dealer data loaded?

### Customer Creation Form Not Appearing
- [ ] Make sure you clicked "Buat Customer Baru"
- [ ] Not "Simpan Customer"
- [ ] Check console for errors

### Customer Not Found Error Still Appears
- [ ] Make sure you clicked "Buat Customer Baru"
- [ ] Created customer should have unique name
- [ ] Submit should work after creation
- [ ] If error persists, check database

---

## 💡 Pro Tips

1. **Try different searches**: name, email, phone
2. **Leave fields blank**: To see fuzzy matching
3. **Create test customer**: With email & phone
4. **Try multiple times**: Different search terms

---

## 🎬 Full Flow Test

### Complete End-to-End
```
1. Upload file with unknown item codes
2. Click "Mulai Proses"
3. Select "End Customer"
4. Click "Buat Customer Baru"
5. Create: "Toko Test", "toko@test.com", "08123456"
6. Click "Simpan & Lanjut"
7. See warning about unknown codes
8. Click "Buat Item Code"
9. Create item codes
10. After modal closes - check destination preserved ✓
11. Click "Submit File Ini"
12. Expected: SUCCESS ✓

Summary:
- Customer created ✓
- Item codes created ✓
- Destination preserved ✓
- File submitted ✓
ALL WORKING! 🎉
```

---

## 📱 Mobile Testing

- [ ] Search field usable on mobile
- [ ] Forms fit on mobile screen
- [ ] Buttons clickable on mobile
- [ ] Modals readable on mobile

---

## 🚀 If All Tests Pass

✅ Dealer search working  
✅ Customer creation working  
✅ No more "tidak ditemukan" errors  
✅ Full flow working  

**Ready for production!** 🚀

---

**Test Duration**: ~5-10 minutes  
**Difficulty**: Easy  
**Expected Result**: All ✓

Good luck! 🎯
