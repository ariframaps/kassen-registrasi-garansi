// lib/mock-users.ts — centralized user management mock data
import type { User } from "@/types";

export let mockUsers: User[] = [
  {
    id: "u1",
    name: "Admin Utama",
    email: "admin@kassengaransi.id",
    role: "admin",
    status: "active",
    createdAt: "2024-01-01",
    lastLogin: "2024-05-02",
  },
  {
    id: "u2",
    name: "Ahmad Sales",
    email: "sales@kassengaransi.id",
    role: "sales",
    status: "active",
    createdAt: "2024-01-10",
    lastLogin: "2024-05-01",
  },
  {
    id: "u3",
    name: "Bima Sales",
    email: "bima@kassengaransi.id",
    role: "sales",
    status: "active",
    createdAt: "2024-02-01",
    lastLogin: "2024-04-28",
  },
  {
    id: "u4",
    name: "PT Maju Teknologi",
    email: "dealer@kassengaransi.id",
    role: "dealer",
    status: "active",
    createdAt: "2024-01-15",
    lastLogin: "2024-04-30",
    dealerId: "d1",
  },
  {
    id: "u5",
    name: "CV Berkah Elektronik",
    email: "berkah@kassengaransi.id",
    role: "dealer",
    status: "active",
    createdAt: "2024-02-20",
    lastLogin: "2024-04-25",
    dealerId: "d2",
  },
  {
    id: "u6",
    name: "Rendra Teknis",
    email: "support@kassengaransi.id",
    role: "technical_support",
    status: "active",
    createdAt: "2024-03-01",
    lastLogin: "2024-04-29",
  },
  {
    id: "u7",
    name: "Dewi Support",
    email: "dewi.support@kassengaransi.id",
    role: "technical_support",
    status: "inactive",
    createdAt: "2024-03-15",
    lastLogin: "2024-04-01",
  },
];

// Demo login map (email → user id)
export const loginMap: Record<string, string> = {
  "admin@kassengaransi.id":   "u1",
  "sales@kassengaransi.id":   "u2",
  "dealer@kassengaransi.id":  "u4",
  "support@kassengaransi.id": "u6",
  // keep old emails working too
  "admin@warranty.com":   "u1",
  "sales@warranty.com":   "u2",
  "dealer@warranty.com":  "u4",
};
