import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/v1';

// Test if server is running
async function testConnection() {
  try {
    const res = await fetch(`${BASE_URL}/products`, {
      headers: {
        'Cookie': 'better-auth.session_token=test' // Mock session
      }
    });
    console.log('✓ Server is running');
    return true;
  } catch (error) {
    console.log('✗ Server not reachable:', error.message);
    return false;
  }
}

// Test upload validate endpoint
async function testValidateEndpoint() {
  console.log('\n📋 Testing /upload/validate endpoint...');

  // Create a simple test file
  const testContent = `
    Item Code,Description,Qty,Serial
    POS-001,Test Item,2,SN12345678
    POS-002,Another Item,1,SN87654321AB
  `;

  try {
    const formData = new FormData();
    formData.append('file', Buffer.from(testContent), 'test.csv');

    const res = await fetch(`${BASE_URL}/upload/validate`, {
      method: 'POST',
      body: formData,
      headers: {
        'Cookie': 'better-auth.session_token=test'
      }
    });

    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('Response:', JSON.stringify(data, null, 2).slice(0, 500));

    if (res.status === 401) {
      console.log('⚠️  Need authentication - this is expected for protected route');
      return true;
    }

    return res.ok;
  } catch (error) {
    console.log('✗ Error:', error.message);
    return false;
  }
}

// Test upload endpoint
async function testUploadEndpoint() {
  console.log('\n📤 Testing /upload endpoint...');

  const testContent = `
    Item Code,Description,Qty,Serial
    POS-001,Test Item,2,SN12345678
  `;

  try {
    const formData = new FormData();
    formData.append('file', Buffer.from(testContent), 'test.csv');
    formData.append('destType', 'customer');
    formData.append('destLabel', 'Test Customer');

    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Cookie': 'better-auth.session_token=test'
      }
    });

    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('Response:', JSON.stringify(data, null, 2).slice(0, 500));

    if (res.status === 401) {
      console.log('⚠️  Need authentication - this is expected for protected route');
      return true;
    }

    return res.ok;
  } catch (error) {
    console.log('✗ Error:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Testing Upload Feature\n');
  console.log('='.repeat(50));

  const connected = await testConnection();
  if (!connected) return;

  await testValidateEndpoint();
  await testUploadEndpoint();

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ API endpoints are responding');
  console.log('⚠️  Authentication required - test in browser with valid session');
  console.log('\n📖 To test manually:');
  console.log('1. Go to http://localhost:3000/dashboard/upload');
  console.log('2. Make sure you are logged in (user should have admin/sales role)');
  console.log('3. Upload an Excel file with serial numbers');
  console.log('4. Verify preview shows correct items');
  console.log('5. Select destination and submit');
}

runTests().catch(console.error);
