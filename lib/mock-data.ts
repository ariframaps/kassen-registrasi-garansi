// lib/mock-data.ts
import type {
  Product, Dealer, WaitingListEntry, DashboardStats, PurchaseGroup, DealerNotification,
} from "@/types";

export const mockDealers: Dealer[] = [
  { id: "d1", name: "PT Maju Teknologi",    email: "maju@tech.co.id",      phone: "0812-3456-7890", totalProducts: 6,  status: "active",   createdAt: "2024-01-15" },
  { id: "d2", name: "CV Berkah Elektronik", email: "berkah@elektronik.id", phone: "0821-9876-5432", totalProducts: 5,  status: "active",   createdAt: "2024-02-20" },
  { id: "d3", name: "Toko Abadi Jaya",      email: "abadi@jaya.co.id",     phone: "0811-2345-6789", totalProducts: 6,  status: "active",   createdAt: "2024-01-08" },
  { id: "d4", name: "UD Surya Mandiri",     email: "surya@mandiri.id",     phone: "0856-7654-3210", totalProducts: 4,  status: "active",   createdAt: "2024-03-01" },
  { id: "d5", name: "PT Delta Solusi",      email: "delta@solusi.co.id",   phone: "0878-1234-5678", totalProducts: 3,  status: "active",   createdAt: "2024-03-15" },
  { id: "d6", name: "CV Mitra Andalan",     email: "mitra@andalan.id",     phone: "0819-8765-4321", totalProducts: 0,  status: "disabled", createdAt: "2024-04-01" },
];

export const mockProducts: Product[] = [
  // ── d1: PT Maju Teknologi ──
  { id:"p1",  serialNumber:"SNAC1234XY",  productType:"KDS 2215W",          productCategory:"POS System",      status:"warranty_active",    assignedDealerId:"d1", assignedDealerName:"PT Maju Teknologi",    warrantyStatus:"active",  warrantyStartDate:"2024-03-01", warrantyEndDate:"2026-03-01", customerName:"Budi Santoso",    customerPhone:"0812-1111-2222", customerEmail:"budi@email.com",    uploadedAt:"2024-02-20", warrantyGroupId:"wg1" },
  { id:"p2",  serialNumber:"SNBC5678AB",  productType:"Queue Kiosk - Luna", productCategory:"POS System",      status:"warranty_active",    assignedDealerId:"d1", assignedDealerName:"PT Maju Teknologi",    warrantyStatus:"active",  warrantyStartDate:"2024-03-01", warrantyEndDate:"2026-03-01", customerName:"Budi Santoso",    customerPhone:"0812-1111-2222", customerEmail:"budi@email.com",    uploadedAt:"2024-02-20", warrantyGroupId:"wg1" },
  { id:"p7",  serialNumber:"SNIJ5678KL",  productType:"MC 40",              productCategory:"Bill Counter",    status:"assigned_to_dealer", assignedDealerId:"d1", assignedDealerName:"PT Maju Teknologi",    warrantyStatus:"none",    uploadedAt:"2024-04-12" },
  { id:"p9",  serialNumber:"SNKL3456OP",  productType:"MC 20",              productCategory:"Bill Counter",    status:"assigned_to_dealer", assignedDealerId:"d1", assignedDealerName:"PT Maju Teknologi",    warrantyStatus:"none",    uploadedAt:"2024-04-18" },
  { id:"p11", serialNumber:"SNMN1122QR",  productType:"BTP 3050",           productCategory:"Receipt Printer", status:"warranty_active",    assignedDealerId:"d1", assignedDealerName:"PT Maju Teknologi",    warrantyStatus:"active",  warrantyStartDate:"2024-04-01", warrantyEndDate:"2026-04-01", customerName:"Citra Dewi",      customerPhone:"0815-2222-3333", customerEmail:"citra@email.com",   uploadedAt:"2024-03-20", warrantyGroupId:"wg4" },
  { id:"p12", serialNumber:"SNOP3344ST",  productType:"KDS 2215W",          productCategory:"POS System",      status:"assigned_to_dealer", assignedDealerId:"d1", assignedDealerName:"PT Maju Teknologi",    warrantyStatus:"none",    uploadedAt:"2024-04-20" },

  // ── d2: CV Berkah Elektronik ──
  { id:"p3",  serialNumber:"SNCD9012CD",  productType:"RF 2400D",           productCategory:"Scanner",         status:"warranty_expired",   assignedDealerId:"d2", assignedDealerName:"CV Berkah Elektronik", warrantyStatus:"expired", warrantyStartDate:"2022-01-15", warrantyEndDate:"2024-01-15", customerName:"Siti Rahayu",     customerPhone:"0813-3333-4444", customerEmail:"siti@email.com",    uploadedAt:"2022-01-10", warrantyGroupId:"wg2" },
  { id:"p6",  serialNumber:"SNHI1234IJ",  productType:"MC 40C",             productCategory:"Bill Counter",    status:"warranty_active",    assignedDealerId:"d2", assignedDealerName:"CV Berkah Elektronik", warrantyStatus:"active",  warrantyStartDate:"2024-02-15", warrantyEndDate:"2026-02-15", customerName:"Ahmad Fauzi",     customerPhone:"0814-5555-6666", customerEmail:"ahmad@email.com",   uploadedAt:"2024-02-01", warrantyGroupId:"wg3" },
  { id:"p13", serialNumber:"SNQR5566UV",  productType:"RS 86V",             productCategory:"Scanner",         status:"warranty_active",    assignedDealerId:"d2", assignedDealerName:"CV Berkah Elektronik", warrantyStatus:"active",  warrantyStartDate:"2024-03-10", warrantyEndDate:"2026-03-10", customerName:"Eko Prasetyo",    customerPhone:"0816-6677-8899", customerEmail:"eko@email.com",     uploadedAt:"2024-03-01", warrantyGroupId:"wg5" },
  { id:"p14", serialNumber:"SNST7788WX",  productType:"KS 606 2D",          productCategory:"Scanner",         status:"warranty_active",    assignedDealerId:"d2", assignedDealerName:"CV Berkah Elektronik", warrantyStatus:"active",  warrantyStartDate:"2024-03-10", warrantyEndDate:"2026-03-10", customerName:"Eko Prasetyo",    customerPhone:"0816-6677-8899", customerEmail:"eko@email.com",     uploadedAt:"2024-03-01", warrantyGroupId:"wg5" },
  { id:"p15", serialNumber:"SNUV9900YZ",  productType:"MC 30",              productCategory:"Bill Counter",    status:"assigned_to_dealer", assignedDealerId:"d2", assignedDealerName:"CV Berkah Elektronik", warrantyStatus:"none",    uploadedAt:"2024-04-22" },

  // ── d3: Toko Abadi Jaya ──
  { id:"p5",  serialNumber:"SNFG7890GH",  productType:"KS 606 2D",          productCategory:"Scanner",         status:"assigned_to_dealer", assignedDealerId:"d3", assignedDealerName:"Toko Abadi Jaya",      warrantyStatus:"none",    uploadedAt:"2024-04-05" },
  { id:"p10", serialNumber:"SNLM7890QR",  productType:"BTP 3050",           productCategory:"Receipt Printer", status:"assigned_to_dealer", assignedDealerId:"d3", assignedDealerName:"Toko Abadi Jaya",      warrantyStatus:"none",    uploadedAt:"2024-04-18" },
  { id:"p16", serialNumber:"SNWX1122AB",  productType:"KDS 2215W",          productCategory:"POS System",      status:"warranty_active",    assignedDealerId:"d3", assignedDealerName:"Toko Abadi Jaya",      warrantyStatus:"active",  warrantyStartDate:"2024-01-20", warrantyEndDate:"2026-01-20", customerName:"Farida Hanum",    customerPhone:"0817-7788-9900", customerEmail:"farida@email.com",  uploadedAt:"2024-01-10", warrantyGroupId:"wg6" },
  { id:"p17", serialNumber:"SNYZ3344CD",  productType:"Queue Kiosk - Luna", productCategory:"POS System",      status:"warranty_active",    assignedDealerId:"d3", assignedDealerName:"Toko Abadi Jaya",      warrantyStatus:"active",  warrantyStartDate:"2024-01-20", warrantyEndDate:"2026-01-20", customerName:"Farida Hanum",    customerPhone:"0817-7788-9900", customerEmail:"farida@email.com",  uploadedAt:"2024-01-10", warrantyGroupId:"wg6" },
  { id:"p18", serialNumber:"SNAB5566EF",  productType:"RF 2400D",           productCategory:"Scanner",         status:"warranty_expired",   assignedDealerId:"d3", assignedDealerName:"Toko Abadi Jaya",      warrantyStatus:"expired", warrantyStartDate:"2021-06-01", warrantyEndDate:"2023-06-01", customerName:"Gunawan Saputra", customerPhone:"0818-8899-0011", customerEmail:"gunawan@email.com", uploadedAt:"2021-05-20", warrantyGroupId:"wg7" },
  { id:"p19", serialNumber:"SNCD7788GH",  productType:"BTP 3050",           productCategory:"Receipt Printer", status:"assigned_to_dealer", assignedDealerId:"d3", assignedDealerName:"Toko Abadi Jaya",      warrantyStatus:"none",    uploadedAt:"2024-04-25" },

  // ── d4: UD Surya Mandiri ──
  { id:"p20", serialNumber:"SNEF9900IJ",  productType:"MC 40C",             productCategory:"Bill Counter",    status:"warranty_active",    assignedDealerId:"d4", assignedDealerName:"UD Surya Mandiri",     warrantyStatus:"active",  warrantyStartDate:"2024-04-05", warrantyEndDate:"2026-04-05", customerName:"Hesti Wulandari", customerPhone:"0819-9900-1122", customerEmail:"hesti@email.com",   uploadedAt:"2024-03-25", warrantyGroupId:"wg8" },
  { id:"p21", serialNumber:"SNGH1122KL",  productType:"KDS 2215W",          productCategory:"POS System",      status:"warranty_active",    assignedDealerId:"d4", assignedDealerName:"UD Surya Mandiri",     warrantyStatus:"active",  warrantyStartDate:"2024-04-05", warrantyEndDate:"2026-04-05", customerName:"Hesti Wulandari", customerPhone:"0819-9900-1122", customerEmail:"hesti@email.com",   uploadedAt:"2024-03-25", warrantyGroupId:"wg8" },
  { id:"p22", serialNumber:"SNIJ3344MN",  productType:"RS 86V",             productCategory:"Scanner",         status:"assigned_to_dealer", assignedDealerId:"d4", assignedDealerName:"UD Surya Mandiri",     warrantyStatus:"none",    uploadedAt:"2024-04-28" },
  { id:"p23", serialNumber:"SNKL5566OP",  productType:"MC 20",              productCategory:"Bill Counter",    status:"assigned_to_dealer", assignedDealerId:"d4", assignedDealerName:"UD Surya Mandiri",     warrantyStatus:"none",    uploadedAt:"2024-04-28" },

  // ── d5: PT Delta Solusi ──
  { id:"p24", serialNumber:"SNMN7788QR",  productType:"KS 606 2D",          productCategory:"Scanner",         status:"warranty_active",    assignedDealerId:"d5", assignedDealerName:"PT Delta Solusi",      warrantyStatus:"active",  warrantyStartDate:"2024-04-10", warrantyEndDate:"2026-04-10", customerName:"Irfan Maulana",   customerPhone:"0820-0011-2233", customerEmail:"irfan@email.com",   uploadedAt:"2024-04-01", warrantyGroupId:"wg9" },
  { id:"p25", serialNumber:"SNOP9900ST",  productType:"BTP 3050",           productCategory:"Receipt Printer", status:"assigned_to_dealer", assignedDealerId:"d5", assignedDealerName:"PT Delta Solusi",      warrantyStatus:"none",    uploadedAt:"2024-04-30" },
  { id:"p26", serialNumber:"SNQR1122UV",  productType:"Queue Kiosk - Luna", productCategory:"POS System",      status:"assigned_to_dealer", assignedDealerId:"d5", assignedDealerName:"PT Delta Solusi",      warrantyStatus:"none",    uploadedAt:"2024-04-30" },

  // ── Unassigned (uploaded_by_sales) ──
  { id:"p4",  serialNumber:"SNDEF3456EF", productType:"RS 86V",             productCategory:"Scanner",         status:"uploaded_by_sales",  warrantyStatus:"none", uploadedAt:"2024-04-10" },
  { id:"p8",  serialNumber:"SNJK9012MN",  productType:"MC 30",              productCategory:"Bill Counter",    status:"uploaded_by_sales",  warrantyStatus:"none", uploadedAt:"2024-04-15" },
  { id:"p27", serialNumber:"SNST3344WX",  productType:"RF 2400D",           productCategory:"Scanner",         status:"uploaded_by_sales",  warrantyStatus:"none", uploadedAt:"2024-05-01" },
  { id:"p28", serialNumber:"SNUV5566YZ",  productType:"KDS 2215W",          productCategory:"POS System",      status:"uploaded_by_sales",  warrantyStatus:"none", uploadedAt:"2024-05-01" },
  { id:"p29", serialNumber:"SNWX7788AB",  productType:"BTP 3050",           productCategory:"Receipt Printer", status:"uploaded_by_sales",  warrantyStatus:"none", uploadedAt:"2024-05-02" },
  { id:"p30", serialNumber:"SNYZ9900CD",  productType:"MC 40",              productCategory:"Bill Counter",    status:"uploaded_by_sales",  warrantyStatus:"none", uploadedAt:"2024-05-02" },
];

export const mockPurchaseGroups: PurchaseGroup[] = [
  { id:"wg1",  serialNumbers:["SNAC1234XY","SNBC5678AB"],  customerName:"Budi Santoso",    customerPhone:"0812-1111-2222", customerEmail:"budi@email.com",    purchaseDate:"2024-03-01", invoiceUrl:"/invoices/wg1.pdf",  invoiceFileName:"invoice-budi-mar2024.pdf",    dealerId:"d1", dealerName:"PT Maju Teknologi",    registeredAt:"2024-03-05", warrantyEndDate:"2026-03-01" },
  { id:"wg2",  serialNumbers:["SNCD9012CD"],                customerName:"Siti Rahayu",     customerPhone:"0813-3333-4444", customerEmail:"siti@email.com",    purchaseDate:"2022-01-15", invoiceUrl:"/invoices/wg2.pdf",  invoiceFileName:"invoice-siti-jan2022.pdf",    dealerId:"d2", dealerName:"CV Berkah Elektronik", registeredAt:"2022-01-20", warrantyEndDate:"2024-01-15" },
  { id:"wg3",  serialNumbers:["SNHI1234IJ"],                customerName:"Ahmad Fauzi",     customerPhone:"0814-5555-6666", customerEmail:"ahmad@email.com",   purchaseDate:"2024-02-15", invoiceUrl:"/invoices/wg3.pdf",  invoiceFileName:"invoice-ahmad-feb2024.pdf",   dealerId:"d2", dealerName:"CV Berkah Elektronik", registeredAt:"2024-02-20", warrantyEndDate:"2026-02-15" },
  { id:"wg4",  serialNumbers:["SNMN1122QR"],                customerName:"Citra Dewi",      customerPhone:"0815-2222-3333", customerEmail:"citra@email.com",   purchaseDate:"2024-04-01", invoiceUrl:"/invoices/wg4.pdf",  invoiceFileName:"invoice-citra-apr2024.pdf",   dealerId:"d1", dealerName:"PT Maju Teknologi",    registeredAt:"2024-04-03", warrantyEndDate:"2026-04-01" },
  { id:"wg5",  serialNumbers:["SNQR5566UV","SNST7788WX"],  customerName:"Eko Prasetyo",    customerPhone:"0816-6677-8899", customerEmail:"eko@email.com",     purchaseDate:"2024-03-10", invoiceUrl:"/invoices/wg5.pdf",  invoiceFileName:"invoice-eko-mar2024.pdf",     dealerId:"d2", dealerName:"CV Berkah Elektronik", registeredAt:"2024-03-12", warrantyEndDate:"2026-03-10" },
  { id:"wg6",  serialNumbers:["SNWX1122AB","SNYZ3344CD"],  customerName:"Farida Hanum",    customerPhone:"0817-7788-9900", customerEmail:"farida@email.com",  purchaseDate:"2024-01-20", invoiceUrl:"/invoices/wg6.pdf",  invoiceFileName:"invoice-farida-jan2024.pdf",  dealerId:"d3", dealerName:"Toko Abadi Jaya",      registeredAt:"2024-01-22", warrantyEndDate:"2026-01-20" },
  { id:"wg7",  serialNumbers:["SNAB5566EF"],                customerName:"Gunawan Saputra", customerPhone:"0818-8899-0011", customerEmail:"gunawan@email.com", purchaseDate:"2021-06-01", invoiceUrl:"/invoices/wg7.pdf",  invoiceFileName:"invoice-gunawan-jun2021.pdf", dealerId:"d3", dealerName:"Toko Abadi Jaya",      registeredAt:"2021-06-03", warrantyEndDate:"2023-06-01" },
  { id:"wg8",  serialNumbers:["SNEF9900IJ","SNGH1122KL"],  customerName:"Hesti Wulandari", customerPhone:"0819-9900-1122", customerEmail:"hesti@email.com",   purchaseDate:"2024-04-05", invoiceUrl:"/invoices/wg8.pdf",  invoiceFileName:"invoice-hesti-apr2024.pdf",   dealerId:"d4", dealerName:"UD Surya Mandiri",     registeredAt:"2024-04-07", warrantyEndDate:"2026-04-05" },
  { id:"wg9",  serialNumbers:["SNMN7788QR"],                customerName:"Irfan Maulana",   customerPhone:"0820-0011-2233", customerEmail:"irfan@email.com",   purchaseDate:"2024-04-10", invoiceUrl:"/invoices/wg9.pdf",  invoiceFileName:"invoice-irfan-apr2024.pdf",   dealerId:"d5", dealerName:"PT Delta Solusi",      registeredAt:"2024-04-11", warrantyEndDate:"2026-04-10" },
  // Registered by sales (no dealer)
  { id:"wg10", serialNumbers:["SNDEF3456EF"],               customerName:"Joko Widodo",     customerPhone:"0821-1122-3344", customerEmail:"joko@email.com",    purchaseDate:"2024-04-12", invoiceUrl:"/invoices/wg10.pdf", invoiceFileName:"invoice-joko-apr2024.pdf",    registeredByName:"Ahmad Sales",    registeredAt:"2024-04-13", warrantyEndDate:"2026-04-12" },
];

export const mockWaitingList: WaitingListEntry[] = [
  { id:"w1", serialNumber:"SNUNKNOWN01", name:"Reza Pratama",       phone:"0815-1234-5678", email:"reza@email.com",   requestDate:"2024-04-10", notified:false, requestorType:"end_user" },
  { id:"w2", serialNumber:"SNUNKNOWN02", name:"Dewi Kusuma",        phone:"0816-9876-5432", email:"dewi@email.com",   requestDate:"2024-04-12", notified:true,  requestorType:"end_user" },
  { id:"w3", serialNumber:"SNKL3456OP",  name:"PT Maju Teknologi",  phone:"0812-3456-7890", email:"maju@tech.co.id",  requestDate:"2024-04-18", notified:true,  requestorType:"dealer", requestorName:"PT Maju Teknologi", dealerId:"d1" },
  { id:"w4", serialNumber:"SNUNKNOWN04", name:"Hendra Wijaya",      phone:"0817-5555-1234", email:"hendra@email.com", requestDate:"2024-04-20", notified:false, requestorType:"end_user" },
];

export const mockDashboardStats: DashboardStats = {
  totalProducts:        mockProducts.length,
  totalAssigned:        mockProducts.filter(p => p.assignedDealerId).length,
  totalWarrantyActive:  mockProducts.filter(p => p.warrantyStatus === "active").length,
  totalWarrantyExpired: mockProducts.filter(p => p.warrantyStatus === "expired").length,
  totalWaitingList:     mockWaitingList.filter(w => !w.notified).length,
};

export const mockRecentActivity = [
  { id:"a1", type:"warranty_registered", description:"Garansi diregistrasi — 2 produk atas nama Hesti Wulandari", user:"UD Surya Mandiri",  time:"1 jam lalu" },
  { id:"a2", type:"warranty_registered", description:"Garansi diregistrasi — KDS 2215W atas nama Irfan Maulana",  user:"PT Delta Solusi",   time:"3 jam lalu" },
  { id:"a3", type:"product_uploaded",    description:"6 produk baru diupload dari Accurate",                       user:"Ahmad Sales",       time:"5 jam lalu" },
  { id:"a4", type:"product_assigned",    description:"3 produk di-assign ke Toko Abadi Jaya",                      user:"Ahmad Sales",       time:"1 hari lalu" },
  { id:"a5", type:"waiting_list",        description:"Request produk dari PT Maju Teknologi — SN SNKL3456OP",     user:"Sistem",            time:"1 hari lalu" },
  { id:"a6", type:"notification_sent",   description:"Notifikasi dikirim ke dewi@email.com",                       user:"Sistem",            time:"2 hari lalu" },
];

// d1 scoped data (for dealer demo account)
export const dealerProducts        = mockProducts.filter(p => p.assignedDealerId === "d1");
export const dealerPurchaseGroups  = mockPurchaseGroups.filter(g => g.dealerId === "d1");

export const mockDealerNotifications: DealerNotification[] = [
  { id:"n1", type:"product_ready", serialNumber:"SNKL3456OP", productType:"MC 20", message:"Produk yang Anda request sudah terdaftar. Segera registrasikan garansi jika sudah terjual.", createdAt:"2024-04-19", read:false },
];

export const PRODUCT_CATEGORIES = ["POS System", "Scanner", "Bill Counter", "Receipt Printer"];
