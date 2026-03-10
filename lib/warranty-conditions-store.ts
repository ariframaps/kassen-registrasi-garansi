// lib/warranty-conditions-store.ts
// Shared in-memory store for warranty conditions (simulates server state)
// In production this would be persisted in a database

import type { WarrantyCondition } from "@/types";

export interface ConditionEntry {
  warrantyCondition: WarrantyCondition;
  warrantyConditionNote: string;
  warrantyConditionUpdatedAt: string;
  warrantyConditionUpdatedBy: string;
}

// Pre-populate: all products with active warranty default to "valid"
const initialConditions: Record<string, ConditionEntry> = {};

// Mock products with active warranty (populated at module load)
const ACTIVE_SNS = [
  "SNAC1234XY","SNBC5678AB","SNHI1234IJ","SNQR5566UV","SNST7788WX",
  "SNMN1122QR","SNWX1122AB","SNYZ3344CD","SNEF9900IJ","SNGH1122KL","SNMN7788QR",
];
ACTIVE_SNS.forEach(sn => {
  initialConditions[sn] = {
    warrantyCondition: "valid",
    warrantyConditionNote: "",
    warrantyConditionUpdatedAt: "",
    warrantyConditionUpdatedBy: "",
  };
});

// In-memory store (shared reference — simulates global state)
export const conditionsStore: Record<string, ConditionEntry> = { ...initialConditions };

export function getCondition(productId: string): ConditionEntry | null {
  return conditionsStore[productId] ?? null;
}

export function setCondition(productId: string, entry: ConditionEntry): void {
  conditionsStore[productId] = entry;
}
