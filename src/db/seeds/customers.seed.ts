import { db } from "@/db";
import { customers } from "@/db/schemas/customers.schema";
import { randomUUID } from "crypto";

export const seedCustomers = async () => {
	const customerIds = Array.from({ length: 5 }, () => randomUUID());

	await db.insert(customers).values([
		{
			id: customerIds[0],
			name: "Budi Santoso",
			email: "budi@gmail.com",
			phone: "081234567890",
			address: "Surabaya",
		},
		{
			id: customerIds[1],
			name: "Siti Aminah",
			email: "siti@gmail.com",
			phone: "081234567891",
			address: "Sidoarjo",
		},
		{
			id: customerIds[2],
			name: "Andi Pratama",
			email: "andi@gmail.com",
			phone: "081234567892",
			address: "Jakarta",
		},
		{
			id: customerIds[3],
			name: "Rina Wijaya",
			email: "rina@gmail.com",
			phone: "081234567893",
			address: "Bandung",
		},
		{
			id: customerIds[4],
			name: "Dewi Lestari",
			email: "dewi@gmail.com",
			phone: "081234567894",
			address: "Bali",
		},
	]);

	return customerIds;
};
