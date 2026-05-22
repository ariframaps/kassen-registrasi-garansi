import { SendOtpResponseData } from "@/app/api/v1/auth/send-otp/route";
import { ApiResponse } from "./api-response";

async function apiFetch<T>(
	input: RequestInfo,
	init?: RequestInit,
): Promise<ApiResponse<T>> {
	const response = await fetch(input, {
		headers: {
			"Content-Type": "application/json",
			...(init?.headers || {}),
		},
		...init,
	});

	const data = await response.json();
	return data;
}

export const authApi = {
	sendOtp: ({ email }: { email: string }) => {
		return apiFetch<SendOtpResponseData>("/api/v1/auth/send-otp", {
			method: "POST",
			body: JSON.stringify({ email }),
		});
	},
	verifyOtp: ({ email, otp }: { email: string; otp: string }) => {
		return apiFetch<SendOtpResponseData>("/api/v1/auth/verify-otp", {
			method: "POST",
			body: JSON.stringify({ email, otp }),
		});
	},
};
