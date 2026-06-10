// Script generate refresh_token Google Drive dengan scope drive.file
// Jalankan: node scripts/get-drive-token.mjs

import { google } from "googleapis";
import http from "http";
import { URL } from "url";

const CLIENT_ID = process.env.google_drive_client_id;
const CLIENT_SECRET = process.env.google_drive_client_secret;
const REDIRECT_URI = "http://localhost:4321/oauth2callback";
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent",
});

// Server lokal untuk menangkap callback dari Google
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:4321");
  if (url.pathname !== "/oauth2callback") {
    res.end("Not found");
    return;
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h2>Error: ${error}</h2><p>Tutup tab ini.</p>`);
    server.close();
    return;
  }

  try {
    const { tokens } = await oAuth2Client.getToken(code);

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <h2 style="color:green">✅ Token berhasil didapat! Tutup tab ini.</h2>
      <p>Lihat terminal untuk instruksi selanjutnya.</p>
    `);

    console.log("\n\n=== BERHASIL! Salin nilai ini ke file .env kamu ===\n");
    console.log(`google_drive_refresh_token=${tokens.refresh_token}`);
    console.log(`google_drive_access_token=${tokens.access_token}`);
    console.log("\n=================================================");
    console.log("refresh_token yang penting (berlaku lama, simpan baik-baik).");

  } catch (err) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h2>Error: ${err.message}</h2>`);
    console.error("Gagal menukar kode:", err.message);
  }

  server.close();
});

server.listen(4321, () => {
  console.log("=== LANGKAH 1 ===");
  console.log("Pastikan http://localhost:4321/oauth2callback sudah ditambahkan");
  console.log("di Google Cloud Console → OAuth 2.0 Client → Authorized redirect URIs\n");
  console.log("=== LANGKAH 2 ===");
  console.log("Buka URL ini di browser:\n");
  console.log(authUrl);
  console.log("\nMenunggu callback dari Google...");
});
