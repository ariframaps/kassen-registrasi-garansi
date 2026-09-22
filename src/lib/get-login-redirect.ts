import { UserRole } from "@/types";

export const getLoginRedirect = (role: UserRole): string => {
	switch (role) {
		case "admin":
		case "sales":
			return "/dashboard";
		case "dealer":
			return "/dealer/dashboard";
		case "technical_support":
			return "/support/products";
		default:
			return "/dashboard";
	}
};
