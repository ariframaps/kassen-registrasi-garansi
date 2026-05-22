import { NormalizedError } from "../normalize-error";

interface NodemailerError extends Error {
	code?: string;
	command?: string;
	response?: string;
	responseCode?: number;
	rejected?: string[] | string;
}

export function nodemailerAdapter(error: NodemailerError): NormalizedError {
	switch (error.code) {
		case "ECONNECTION":
		case "ETIMEDOUT":
		case "EDNS":
		case "ESOCKET":
			return {
				type: "email",
				issues: ["Gagal terhubung ke server email. Silakan coba lagi nanti."],
				details: error,
			};

		case "EAUTH":
		case "ENOAUTH":
			return {
				type: "email",
				issues: ["Gagal mengirim email karena masalah autentikasi server."],
				details: error,
			};

		case "EOAUTH2":
			return {
				type: "email",
				issues: ["Konfigurasi token email kadaluwarsa."],
				details: error,
			};

		case "EENVELOPE":
			return {
				type: "email",
				issues: ["Alamat email penerima tidak valid atau ditolak."],
				details: error,
			};

		default:
			return {
				type: "email",
				issues: ["Gagal mengirim email karena kesalahan tidak terduga."],
				details: error,
			};
	}
}
