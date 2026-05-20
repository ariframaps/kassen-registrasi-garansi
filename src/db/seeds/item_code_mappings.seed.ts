import { db } from "@/db";
import { itemCodeMappings } from "@/db/schemas/item_code_mappings.schema";

export const seedItemCodeMappings = async (
	productTypeMap: Record<string, string>,
) => {
	await db.insert(itemCodeMappings).values([
		// POS SYSTEM
		{
			itemCode: "POS-3453MFH",
			productTypeId: productTypeMap["pos system"],
		},
		{
			itemCode: "POS-3453MFG",
			productTypeId: productTypeMap["pos system"],
		},

		// SCANNER
		{
			itemCode: "SCN-1001A",
			productTypeId: productTypeMap["scanner"],
		},
		{
			itemCode: "SCN-1002B",
			productTypeId: productTypeMap["scanner"],
		},

		// RECEIPT PRINTER
		{
			itemCode: "RP-THERMAL-88",
			productTypeId: productTypeMap["receipt printer"],
		},

		// BARCODE PRINTER
		{
			itemCode: "BP-ZEBRA-220",
			productTypeId: productTypeMap["barcode printer"],
		},

		// CASH DRAWER
		{
			itemCode: "CD-STD-01",
			productTypeId: productTypeMap["cash drawer"],
		},

		// RFID SYSTEM
		{
			itemCode: "RFID-BASIC-01",
			productTypeId: productTypeMap["rfid system"],
		},

		// PORTABLE DATA TERMINAL
		{
			itemCode: "PDT-IND-55",
			productTypeId: productTypeMap["portable data terminal"],
		},

		// BILL COUNTER
		{
			itemCode: "BC-COUNT-10",
			productTypeId: productTypeMap["bill counter"],
		},

		// SUPPLIES
		{
			itemCode: "SUP-DEFAULT",
			productTypeId: productTypeMap["supplies"],
		},
	]);
};
