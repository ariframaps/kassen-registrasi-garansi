# Quick Test Guide: Bulk Create Item Codes

## 🚀 Quick Start

### 1. Access Upload Page
```
URL: http://localhost:3000/dashboard/upload
Login: Use admin/sales account
```

### 2. Trigger Unknown Items
File dengan unknown item codes akan menampilkan warning.
Mock data sudah ada: `POS-3453MFH` (5 unit)

### 3. Click "Buat Item Code" Button
- Lokasi: Warning box dengan text "Ada X item code yang belum dikenali"
- Icon: Plus icon
- Text: "Buat Item Code"

### 4. Fill Form
```
Item Code: POS-3453MFH (5 unit)
├─ Nama Tipe Produk: [Input] "POS Terminal Pro Max"
├─ Kategori: [Dropdown] Pilih dari list
└─ Garansi (bulan): [Input] 12 (default)
```

### 5. Click "Buat 1 Item Code" Button
- Text akan berubah menjadi "Menyimpan..." dengan spinner
- Semua inputs disabled selama proses

### 6. Success!
```
✓ Toast: "Berhasil - 1 item code baru telah ditambahkan ke sistem"
✓ Modal closes automatically
✓ Preview refreshes
✓ Previously unknown item sekarang valid
✓ Ready to submit file
```

---

## 🧪 Test Scenarios

### Scenario 1: Single Unknown Code
**Expectation**: 
- Modal shows 1 form
- Button text: "Buat 1 Item Code"

### Scenario 2: Multiple Unknown Codes (3+)
**Expectation**:
- Modal shows all 3 forms
- Button text: "Buat 3 Item Code"
- All forms scrollable if needed

### Scenario 3: Validation Error
**Trigger**: Click submit dengan field kosong
**Expectation**: Toast error "Harap lengkapi semua nama produk dan kategori"

### Scenario 4: API Error
**Trigger**: Network error saat create
**Expectation**: Toast error dengan pesan error

### Scenario 5: Duplicate Name
**Trigger**: Input product type name yang sudah ada
**Expectation**: API returns 400 error, user dapat retry

---

## 🔍 Things to Check

### Visual
- [ ] Warning box styling (amber background)
- [ ] "Buat Item Code" button visible and clickable
- [ ] Modal opens with correct title and description
- [ ] Form inputs properly aligned
- [ ] Spinner icon shows during loading
- [ ] Toast notifications appear correctly

### Functionality
- [ ] Can type in product type name input
- [ ] Category dropdown opens and loads categories
- [ ] Warranty input accepts numbers
- [ ] Validation works (prevents submit with empty fields)
- [ ] Submit button text changes dynamically
- [ ] Modal closes after success
- [ ] Preview auto-refreshes
- [ ] Unknown items become valid

### Performance
- [ ] Modal opens quickly (<500ms)
- [ ] Categories load immediately
- [ ] Submit completes in reasonable time
- [ ] No UI lag when scrolling

---

## 🔧 Browser DevTools Checklist

### Console (F12)
```javascript
// No JavaScript errors
// No TypeScript errors
// Check logs for API calls
```

### Network Tab
```
GET /api/v1/product-categories  → 200 OK
POST /api/v1/product-types      → 201 Created
POST /api/v1/upload/validate    → 200 OK (refresh)
```

### Elements
- Modal has `data-dialog` or similar attribute
- Form inputs properly labeled
- Buttons have `disabled` attribute when loading

---

## 📱 Mobile Testing

- [ ] Modal fits on mobile screen
- [ ] Form inputs are touch-friendly
- [ ] Dropdown scrolls smoothly
- [ ] Buttons are clickable on mobile

---

## 🐛 Known Limitations

- Categories must have at least one entry (otherwise dropdown empty)
- Product type name must be unique across system
- No draft save (if user closes modal, form data lost)
- File must be reprocessed after creating item codes

---

## 💡 Pro Tips

1. **Test with multiple codes** - Upload file dengan 5+ unknown codes untuk test scrolling
2. **Test validation** - Coba submit dengan field kosong untuk test validation
3. **Check Network Tab** - Lihat batch create dengan Promise.all() di network tab
4. **Check Console** - Log messages menunjukkan flow execution
5. **Test Error States** - Disable network dan test error handling

---

## 📊 Success Criteria

✅ Modal opens when clicking "Buat Item Code"
✅ Form fields are editable and bind correctly
✅ Categories load in dropdown
✅ Validation prevents empty submit
✅ API calls create product types correctly
✅ Success toast shows
✅ Preview auto-refreshes
✅ Unknown items become valid
✅ File can be submitted after creating item codes
✅ Error handling works properly

---

## 🎯 Test Execution Time

- **Quick Test**: 3-5 minutes
- **Full Test**: 10-15 minutes  
- **Stress Test** (1000+ items): 30+ minutes

---

## 📝 Test Log Template

```markdown
# Test Execution Log

**Date**: [YYYY-MM-DD]
**Tester**: [Name]
**Browser**: [Chrome/Firefox/Safari/Edge]

## Test Results

- [ ] Scenario 1: Single Code _____ (PASS/FAIL)
- [ ] Scenario 2: Multiple Codes _____ (PASS/FAIL)
- [ ] Scenario 3: Validation _____ (PASS/FAIL)
- [ ] Scenario 4: Error Handling _____ (PASS/FAIL)
- [ ] Scenario 5: Performance _____ (PASS/FAIL)

## Issues Found

[List any bugs or issues]

## Notes

[Additional observations]
```

---

**Ready to Test!** 🚀
Open http://localhost:3000/dashboard/upload and follow the steps above.
