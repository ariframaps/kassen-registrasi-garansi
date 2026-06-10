#!/bin/bash
echo "📋 VERIFICATION CHECKLIST - Upload Feature"
echo "=========================================="
echo ""

echo "✓ Parser-Accurate Functions:"
grep -q "export.*validateAndPreview" src/lib/parser-accurate.ts && echo "  ✅ validateAndPreview() exported" || echo "  ❌ validateAndPreview() missing"
grep -q "export.*parseExcelFile" src/lib/parser-accurate.ts && echo "  ✅ parseExcelFile() exported" || echo "  ❌ parseExcelFile() missing"
echo ""

echo "✓ Accurate Service Functions:"
grep -q "export.*submitAccurateFile" src/services/accurate.service.ts && echo "  ✅ submitAccurateFile() exported" || echo "  ❌ submitAccurateFile() missing"
grep -q "export.*validateAccurateFile" src/services/accurate.service.ts && echo "  ✅ validateAccurateFile() exported" || echo "  ❌ validateAccurateFile() missing"
grep -q "export.*getProductTypeMappings" src/services/accurate.service.ts && echo "  ✅ getProductTypeMappings() exported" || echo "  ❌ getProductTypeMappings() missing"
echo ""

echo "✓ Upload Routes:"
test -f src/app/api/v1/upload/route.ts && echo "  ✅ /upload route exists" || echo "  ❌ /upload route missing"
test -f src/app/api/v1/upload/validate/route.ts && echo "  ✅ /upload/validate route exists" || echo "  ❌ /upload/validate route missing"
grep -q "authenticationMiddleware" src/app/api/v1/upload/route.ts && echo "  ✅ Authentication enabled" || echo "  ❌ Authentication missing"
echo ""

echo "✓ API Client Methods:"
grep -q "validateAccurateFile.*File" src/lib/api/api-client.ts && echo "  ✅ uploadApi.validateAccurateFile() defined" || echo "  ❌ validateAccurateFile() missing"
grep -q "uploadAccurateFile.*File" src/lib/api/api-client.ts && echo "  ✅ uploadApi.uploadAccurateFile() defined" || echo "  ❌ uploadAccurateFile() missing"
echo ""

echo "✓ Frontend Integration:"
grep -q "uploadApi.validateAccurateFile" src/app/\(protected\)/dashboard/upload/page.tsx && echo "  ✅ Frontend calls validate API" || echo "  ❌ Frontend validate missing"
grep -q "uploadApi.uploadAccurateFile" src/app/\(protected\)/dashboard/upload/page.tsx && echo "  ✅ Frontend calls upload API" || echo "  ❌ Frontend upload missing"
echo ""

echo "=========================================="
echo "Verification complete! ✅"
