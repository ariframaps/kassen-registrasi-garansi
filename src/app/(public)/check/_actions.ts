import { Product } from "@/types";

export const publicCheckWarranty = async (sn: string): Promise<Product> => {
	return {
		id: "1",
	};
};

export const publicWaitingList = async (
	normedSN: string,
	name: string,
	phoneNumber: string,
	contactEmail: string,
): Promise<Boolean> => {
	return true;
};
