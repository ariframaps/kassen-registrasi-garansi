// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
	const token = req.cookies.get("auth_token")?.value;

	const isAuthRoute = req.nextUrl.pathname !== "/check";

	if (!isAuthRoute) return NextResponse.next();

	if (!token) {
		return NextResponse.redirect(new URL("/login", req.url));
	}

	try {
		// await jwtVerify(token, secret);
		return NextResponse.next();
	} catch {
		return NextResponse.redirect(new URL("/login", req.url));
	}
}

export const config = {
	matcher: "/((?!check$).*)",
};
