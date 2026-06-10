import { Product } from "@/types";
import { warrantyApi, waitingListApi } from "@/lib/api/api-client";

export const publicCheckWarranty = async (sn: string): Promise<Product | null> => {
	const response = await warrantyApi.check(sn);
	if (!response.success) {
		throw new Error(response.message || "Failed to check warranty");
	}
	return response.data || null;
};

export const publicWaitingList = async (
	serialNumber: string,
	name: string,
	phoneNumber: string,
	email: string,
): Promise<boolean> => {
	const response = await waitingListApi.createPublic({
		serialNumberRequested: serialNumber,
		requesterType: "end_user",
		requesterName: name,
		requesterPhone: phoneNumber,
		requesterEmail: email,
	});
	if (!response.success) {
		throw new Error(response.message || "Failed to submit waiting list request");
	}
	return true;
};
