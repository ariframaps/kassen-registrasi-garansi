import { User } from "@/types";

const wait = async () => {
	return new Promise((resolve) => setTimeout(resolve, 800));
};

// export const sendOtp = async (
// 	email: string,
// ): Promise<{ success: boolean; message?: string }> => {
// 	try {
// 		const response = await fetch("/api/v1/auth/send-otp", {
// 			method: "POST",
// 			headers: {
// 				"Content-Type": "application/json",
// 			},
// 			body: JSON.stringify({ email }),
// 		});

// 		const data = await response.json();

// 		if (!response.ok) {
// 			throw new Error(data.message || "Gagal mengirim OTP");
// 		}

// 		return
// 	} catch (error) {
// 		console.error("Error in sendOtp:", error);
// 		return {
// 			success: false,
// 			message:
// 				error instanceof Error ? error.message : "Terjadi kesalahan koneksi",
// 		};
// 	}
// };

export const verifyOtp = async (otp: string) => {
	await wait();
	return;
};

export const signIn = async (email: string): Promise<User> => {
	await wait();
	return {
		id: "1",
		name: "arif",
		email: "",
		role: "admin",
		status: "active",
		dealer_id: "0",
		created_at: "",
		updated_at: "",
		deleted_at: "",
		last_login: "",
	};
};

export const resendOtp = async (email: string) => {
	await wait();
	return;
};

export const checkSession = async () => {
	await wait();
	return;
};
