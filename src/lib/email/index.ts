import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { SentMessageInfo } from "nodemailer";
import { siteConfig } from "@/configs/site.config";
import { transporter } from "../nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type TemplateVariables = Record<string, string | number>;

function renderEmailTemplate({
	templateFileName,
	templateVariables,
}: {
	templateFileName: string;
	templateVariables: TemplateVariables;
}) {
	const filePath = path.join(__dirname, `${templateFileName}.html`);

	let html = fs.readFileSync(filePath, "utf-8");
	if (!html) throw new Error("no such file email template");

	for (const [key, value] of Object.entries(templateVariables)) {
		html = html.replaceAll(`{{${key}}}`, String(value));
	}

	return html;
}

export async function sendEmail({
	to: email,
	subject,
	templateFileName,
	templateVariables,
}: {
	to: string;
	subject: string;
	templateFileName: string;
	templateVariables: TemplateVariables;
}): Promise<void> {
	const message = {
		from: '"Kassen Warranty" <info@kassen.com.tw>',
		to: email,
		subject: `${siteConfig.SITE_NAME} - ${subject}`,
		html: renderEmailTemplate({
			templateFileName,
			templateVariables,
		}),
	};

	const info: SentMessageInfo = await transporter.sendMail(message);

	if (info.rejected && info.rejected.includes(email))
		throw new Error("Email ditolak oleh server tujuan.");

	console.log("✅ Email sent successfully : ");

	return;
}
