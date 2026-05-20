import { db } from "@/db";
import { deliveryOrders } from "@/db/schemas/delivery_orders.schema";
import { createHash, randomUUID } from "crypto";

export const seedDeliveryOrders = async (ctx: {
	userId: string;
	dealerIds: string[];
	customerIds: string[];
}) => {
	const doIds = Array.from({ length: 3 }, () => randomUUID());

	await db.insert(deliveryOrders).values([
		{
			id: doIds[0],
			doNumber: "DO.2026.01.001",
			doDate: "2026-01-10",
			shipToRaw: "Dealer Alpha Group - Jakarta",
			sentBy: "System Import",
			orderRef: "ORD-001",
			dcRef: "DC-001",
			destinationType: "dealer",
			destinationDealerId: ctx.dealerIds[0],
			uploadedBy: ctx.userId,
			fileHash: createHash("sha256").update("do-001").digest("hex"),
			originalFilename: "do_alpha.xlsx",
		},
		{
			id: doIds[1],
			doNumber: "DO.2026.01.002",
			doDate: "2026-01-15",
			shipToRaw: "Dealer Beta Group - Bandung",
			sentBy: "System Import",
			orderRef: "ORD-002",
			dcRef: "DC-002",
			destinationType: "dealer",
			destinationDealerId: ctx.dealerIds[1],
			uploadedBy: ctx.userId,
			fileHash: createHash("sha256").update("do-002").digest("hex"),
			originalFilename: "do_beta.xlsx",
		},
		{
			id: doIds[2],
			doNumber: "DO.2026.01.003",
			doDate: "2026-01-20",
			shipToRaw: "End Customer - PT Maju Jaya",
			sentBy: "Sales Input",
			orderRef: "ORD-003",
			dcRef: "DC-003",
			destinationType: "customer",
			destinationCustomerId: ctx.customerIds[0],
			uploadedBy: ctx.userId,
			fileHash: createHash("sha256").update("do-003").digest("hex"),
			originalFilename: "do_customer.xlsx",
		},
	]);

	return doIds;
};
