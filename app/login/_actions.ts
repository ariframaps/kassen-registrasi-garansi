"use server";

import { serverEnv } from "@/lib/env-server";
import { User } from "@/types";

const wait = async () => {
	return new Promise((resolve) => setTimeout(resolve, 800));
};

export const checkEmailIsExist = async (email: string) => {
	await wait();
	return;
};

export const sendOtp = async (email: string) => {
	await wait();
	return;
};

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
