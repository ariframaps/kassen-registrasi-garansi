// import { transporter } from "./nodemailer";
import { authConfig } from "@/configs/auth.config";
import { transporter } from "./nodemailer";
import { SentMessageInfo } from "nodemailer";
import { renderEmailTemplate } from "./email-templates";

export async function sendEmailOtp({
	to: email,
	otp,
}: {
	to: string;
	otp: string;
}): Promise<void> {
	const message = {
		from: '"Kassen Warrany" <info@kassen.com.tw>',
		to: email,
		subject: "Your OTP Code",
		html: renderEmailTemplate("otp", {
			otp: otp,
			expiresIn: authConfig.OTP_EXPIRES_IN,
		}),
	};

	const info: SentMessageInfo = await transporter.sendMail(message);

	if (info.rejected && info.rejected.includes(email))
		throw new Error("Email ditolak oleh server tujuan.");

	return;
}

// Interface khusus untuk mendeteksi struktur error detail di dalam 'rejectedErrors'
// interface RejectedErrorDetail {
// 	recipient: string;
// 	message: string;
// 	code?: string;
// }

// console.warn("⚠️ Email terkirim, tetapi beberapa penerima ditolak:");
// console.warn("Diterima:", info.accepted);
// console.warn("Ditolak:", info.rejected);

// // Mengamankan iterasi rejectedErrors dengan casting tipe data yang jelas
// if (info.rejectedErrors) {
// 	(info.rejectedErrors as RejectedErrorDetail[]).forEach((err) => {
// 		console.warn(`Detail Penolakan -> ${err.recipient}: ${err.message}`);
// 	});
// }

// Jika email tujuan utama masuk daftar reject, langsung lempar error kustom
