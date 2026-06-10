import { google } from "googleapis";
import { Readable } from "stream";

function getDriveClient() {
	const auth = new google.auth.OAuth2(
		process.env.GOOGLE_DRIVE_CLIENT_ID,
		process.env.GOOGLE_DRIVE_CLIENT_SECRET,
	);
	auth.setCredentials({
		refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
		access_token: process.env.GOOGLE_DRIVE_ACCESS_TOKEN,
	});
	return google.drive({ version: "v3", auth });
}

export async function uploadInvoiceToDrive(
	fileBuffer: Buffer,
	fileName: string,
	mimeType: string,
): Promise<string> {
	const auth = new google.auth.OAuth2(
		process.env.GOOGLE_DRIVE_CLIENT_ID,
		process.env.GOOGLE_DRIVE_CLIENT_SECRET,
	);
	auth.setCredentials({
		refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
	});

	const drive = google.drive({ version: "v3", auth });
	const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
	if (!folderId) throw new Error("GOOGLE_DRIVE_FOLDER_ID tidak dikonfigurasi");

	const uploadRes = await drive.files.create({
		requestBody: {
			name: fileName,
			parents: [folderId],
		},
		media: {
			mimeType,
			body: Readable.from(fileBuffer),
		},
		fields: "id,webViewLink",
	});

	const fileId = uploadRes.data.id;
	if (!fileId) throw new Error("Google Drive tidak mengembalikan file ID");

	await drive.permissions.create({
		fileId,
		requestBody: {
			role: "reader",
			type: "anyone",
		},
	});

	const webViewLink = uploadRes.data.webViewLink;
	if (!webViewLink) throw new Error("Gagal mendapatkan link publik Google Drive");

	return webViewLink;
}
