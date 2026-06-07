import { db } from "@/db";
import {
	ItemCodeInsertSchema,
	itemCodeMapping,
	itemCodeMapsSchema,
	ItemCodeMapsSchema,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export const itemCodeService = {
	findOneByCode: async ({
		code,
	}: {
		code: string;
	}): Promise<ItemCodeMapsSchema | undefined> => {
		const result = await db.query.itemCodeMapping.findFirst({
			where: eq(itemCodeMapping.itemCode, code),
		});

		if (result === undefined) return undefined;

		const parsed = itemCodeMapsSchema.parse(result);
		return parsed;
	},

	getItemCodesByType: async ({
		typeId,
	}: {
		typeId: string;
	}): Promise<ItemCodeMapsSchema[]> => {
		const result = await db.query.itemCodeMapping.findMany({
			where: eq(itemCodeMapping.productTypeId, typeId),
		});

		const parsed = itemCodeMapsSchema.array().parse(result);
		return parsed;
	},

	getAll: async (): Promise<ItemCodeMapsSchema[]> => {
		const result = await db.query.itemCodeMapping.findMany();

		const parsed = itemCodeMapsSchema.array().parse(result);
		return parsed;
	},

	update: async ({
		typeId,
		data,
	}: {
		typeId: string;
		data: {
			deleted: string[];
			added: string[];
		};
	}): Promise<ItemCodeMapsSchema[]> => {
		await db
			.delete(itemCodeMapping)
			.where(inArray(itemCodeMapping.id, data.deleted));

		console.log(data);

		if (data.added.length > 0) {
			const addItems: ItemCodeInsertSchema[] = data.added.map((code) => {
				return {
					id: crypto.randomUUID(),
					itemCode: code,
					productTypeId: typeId,
				};
			});
			const newValues = await db
				.insert(itemCodeMapping)
				.values(addItems)
				.returning();
			console.log(newValues);
			const parsedNewValue = itemCodeMapsSchema.array().parse(newValues);
			return parsedNewValue;
		}

		return [];
	},

	add: async (data: ItemCodeInsertSchema[]): Promise<ItemCodeMapsSchema[]> => {
		const dataWithIds = data.map((item) => ({
			...item,
			id: crypto.randomUUID(),
		}));
		const result = await db.insert(itemCodeMapping).values(dataWithIds).returning();
		const parsed = itemCodeMapsSchema.array().parse(result);
		return parsed;
	},
};
