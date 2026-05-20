import { db } from "@/db";
import {
	invoices,
	InvoicesInsertSchemaType,
} from "@/db/schemas/invoices.schema";
import crypto from "crypto";

export const seedInvoices = async (ctx: {
	purchaseIds: string[];
	userId: string;
}) => {
	const rows: InvoicesInsertSchemaType[] = [];

	const mimeTypes = ["application/pdf", "image/jpeg"];

	for (let i = 0; i < ctx.purchaseIds.length; i++) {
		const purchaseId = ctx.purchaseIds[i];

		// simulate: tidak semua purchase langsung punya invoice
		if (i % 4 === 0) continue;

		rows.push({
			id: crypto.randomUUID(),
			purchaseId,
			storagePath: `invoices/inv-${purchaseId}.pdf`,
			originalFilename: `invoice-${i + 1}.pdf`,
			mimeType: mimeTypes[i % mimeTypes.length],
			fileSizeBytes: 1024 * (200 + i * 10), // fake size
			uploadedBy: ctx.userId,
		});
	}

	await db.insert(invoices).values(rows);

	return;
};
