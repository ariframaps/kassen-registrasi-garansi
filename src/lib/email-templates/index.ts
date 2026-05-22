import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Variables = Record<string, string | number>;

export function renderEmailTemplate(
	templateName: string,
	variables: Variables,
) {
	const filePath = path.join(__dirname, `${templateName}.html`);
	console.log(filePath);

	let html = fs.readFileSync(filePath, "utf-8");

	for (const [key, value] of Object.entries(variables)) {
		html = html.replaceAll(`{{${key}}}`, String(value));
	}

	return html;
}
