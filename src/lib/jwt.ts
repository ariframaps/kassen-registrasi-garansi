import { SignJWT, jwtVerify } from "jose";
import { envServer } from "./env-server";

const secret = new TextEncoder().encode(envServer.JWT_SECRET!);

export async function createToken(payload: { userId: string }) {
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setExpirationTime("7d")
		.sign(secret);
}

export async function verifyToken(token: string) {
	const { payload } = await jwtVerify(token, secret);
	return payload;
}
