// types/index.ts
export type UserRole = "admin" | "sales" | "dealer" | "technical_support";

export type ProductStatus =
	| "uploaded_by_sales"
	| "assigned_to_dealer"
	| "warranty_active"
	| "warranty_expired";

export type WarrantyStatus = "active" | "expired" | "none";

// Per-product warranty condition (set by technical support)
export type WarrantyCondition = "valid" | "rejected" | null;

export interface User {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	dealerId?: string;
	status: "active" | "inactive";
	dealer_id: string;
	created_at: string;
	updated_at: string;
	deleted_at: string;
	last_login?: string;
}

export interface Dealer {
	id: string;
	name: string;
	email: string;
	phone?: string;
	address?: string;
	status: "active" | "inactive";
	created_at: string;
	updated_at?: string;
}

export interface Customer {
	id: string;
	name: string;
	email: string;
	phone: string;
	address: string;
	created_at: string;
	updated_at: string;
}

export interface Product {
	id: string;
	serialNumber: string;
	productType: string;
	productCategory: string;
	status: ProductStatus;
	assignedDealerId?: string;
	assignedDealerName?: string;
	warrantyStatus: WarrantyStatus;
	warrantyStartDate?: string;
	warrantyEndDate?: string;
	customerName?: string;
	customerPhone?: string;
	customerEmail?: string;
	invoiceUrl?: string;
	uploadedAt: string;
	warrantyGroupId?: string;
	// Technical support fields
	warrantyCondition?: WarrantyCondition;
	warrantyConditionNote?: string;
	warrantyConditionUpdatedAt?: string;
	warrantyConditionUpdatedBy?: string;
}

export interface PurchaseGroup {
	id: string;
	serialNumbers: string[];
	customerName: string;
	customerPhone: string;
	customerEmail: string;
	purchaseDate: string;
	invoiceUrl: string;
	invoiceFileName: string;
	dealerId?: string;
	dealerName?: string;
	registeredById?: string;
	registeredByName?: string;
	registeredAt: string;
	warrantyEndDate: string;
	notes?: string;
}

export interface WaitingListEntry {
	id: string;
	serialNumber: string;
	name: string;
	phone: string;
	email: string;
	requestDate: string;
	notified: boolean;
	requestorType: "end_user" | "dealer";
	requestorName?: string;
	dealerId?: string;
}

export interface DashboardStats {
	totalProducts: number;
	totalAssigned: number;
	totalWarrantyActive: number;
	totalWarrantyExpired: number;
	totalWaitingList: number;
}

export interface DealerNotification {
	id: string;
	type: "product_ready" | "warranty_expiring";
	serialNumber: string;
	productType: string;
	message: string;
	createdAt: string;
	read: boolean;
}
