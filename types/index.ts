// types/index.ts
export type UserRole = "superadmin" | "sales" | "dealer" | "customer";

export type ProductStatus =
  | "uploaded_by_sales"
  | "assigned_to_dealer"
  | "warranty_active"
  | "warranty_expired";

export type WarrantyStatus = "active" | "expired" | "none";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  dealerId?: string;
}

export interface Dealer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalProducts: number;
  status: "active" | "disabled";
  createdAt: string;
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
}

// A "purchase group" = 1 invoice = 1 or more SNs sold together
export interface PurchaseGroup {
  id: string;
  serialNumbers: string[];          // SN list at time of registration
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  purchaseDate: string;             // = warrantyStartDate for all SNs
  invoiceUrl: string;               // uploaded file name/path
  invoiceFileName: string;
  dealerId?: string;
  dealerName?: string;
  registeredById?: string;          // sales user id if registered by sales
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
