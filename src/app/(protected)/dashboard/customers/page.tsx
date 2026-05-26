"use client";
// app/dashboard/customers/page.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableHead,
	TableHeader,
	TableBody,
	TableRow,
	TableCell,
	EmptyState,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
// import { customerAdapter } from "@/lib/adapters";
// import type { Customer } from "@/lib/adapters";
import { Search, Users, ChevronRight } from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import { CustomerSchema } from "@/db/schema";
import { customerApi } from "@/lib/api/api-client";

export default function CustomersPage() {
	const router = useRouter();
	const [customers, setCustomers] = useState<CustomerSchema[]>([]);
	const [total, setTotal] = useState(0);
	// const [page, setPage] = useState(1);
	// const [pageSize, setPageSize] = useState(20);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);

	const filtered = useMemo(() => {
		setLoading(true);
		const result = customers.filter(
			(c) =>
				!search ||
				c.name.toLowerCase().includes(search.toLowerCase()) ||
				c.email.toLowerCase().includes(search.toLowerCase()) ||
				c.phone?.toLowerCase().includes(search.toLowerCase()),
		);
		setLoading(false);
		return result;
	}, [search, customers]);

	// Reset to page 1 on search change
	const handleSearch = (val: string) => {
		setSearch(val);
		// setPage(1);
	};

	useEffect(() => {
		const fetchData = async () => {
			const data = await customerApi.getAll();
			if (data.success) {
				setCustomers([...data.data]);
				setTotal(data.data.length);
			}
		};

		fetchData();
	}, []);

	return (
		<div className="flex flex-col min-h-screen bg-[var(--bg)]">
			<Topbar title="Manajemen Customer" />
			<main className="flex-1 p-6 space-y-5 animate-fade-up">
				{/* Stats */}
				{/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="bg-white border border-zinc-200 rounded-xl px-4 py-3 shadow-sm">
						<p className="text-xs text-zinc-500 mb-0.5">Total Customer</p>
						<p className="text-2xl font-bold text-zinc-900">{total}</p>
					</div>
					<div className="bg-white border border-zinc-200 rounded-xl px-4 py-3 shadow-sm">
						<p className="text-xs text-zinc-500 mb-0.5">Lintas Dealer</p>
						<p className="text-2xl font-bold text-zinc-900">
              {customers.filter((c) => c.dealers.length > 1).length}
            </p>
						<p className="text-xs text-zinc-400">beli di &gt;1 dealer</p>
					</div>
					<div className="bg-white border border-zinc-200 rounded-xl px-4 py-3 shadow-sm">
						<p className="text-xs text-zinc-500 mb-0.5">Total Pembelian</p>
						<p className="text-2xl font-bold text-zinc-900">
              {customers.reduce((s, c) => s + c.totalPurchases, 0)}
            </p>
					</div>
				</div> */}

				<Card>
					<CardHeader
						title="Daftar Customer"
						description="Data customer dari semua dealer"
					/>
					<div className="px-5 py-3 border-b border-zinc-100">
						<Input
							placeholder="Cari nama, email, atau nomor HP…"
							value={search}
							onChange={(e) => handleSearch(e.target.value)}
							leftIcon={<Search size={13} />}
							className="max-w-80"
						/>
					</div>

					{loading ? (
						<div className="py-14 text-center text-sm text-zinc-400">
							Memuat data…
						</div>
					) : (
						<>
							<Table>
								<TableHead>
									<TableHeader>Nama</TableHeader>
									<TableHeader>Email</TableHeader>
									<TableHeader>No. HP</TableHeader>
									{/* <TableHeader>Dealer</TableHeader> */}
									{/* <TableHeader>Pembelian</TableHeader> */}
									<TableHeader>Terdaftar</TableHeader>
									<TableHeader className="w-8"></TableHeader>
								</TableHead>
								<TableBody>
									{filtered.length === 0 ? (
										<tr>
											<td colSpan={7}>
												<EmptyState
													icon={<Users size={18} />}
													title="Tidak ada customer"
													description={
														search
															? "Coba ubah kata kunci pencarian"
															: "Belum ada data customer"
													}
												/>
											</td>
										</tr>
									) : (
										filtered.map((c) => (
											<TableRow
												key={c.id}
												onClick={() =>
													router.push(`/dashboard/customers/${c.id}`)
												}>
												<TableCell>
													<div className="flex items-center gap-2.5">
														<div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
															<span className="text-blue-600 text-xs font-bold uppercase">
																{c.name.charAt(0)}
															</span>
														</div>
														<span className="font-medium text-zinc-900">
															{c.name}
														</span>
													</div>
												</TableCell>
												<TableCell className="text-zinc-600">
													{c.email}
												</TableCell>
												<TableCell className="text-zinc-600">
													{c.phone}
												</TableCell>
												{/* <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {c.dealers.length === 0 ? (
                              <span className="text-xs text-zinc-400">—</span>
                            ) : c.dealers.length > 2 ? (
                              <>
                                <Badge variant="neutral">{c.dealers[0]}</Badge>
                                <Badge variant="neutral">+{c.dealers.length - 1} lainnya</Badge>
                              </>
                            ) : (
                              c.dealers.map((d) => (
                                <Badge key={d} variant="neutral">{d}</Badge>
                              ))
                            )}
                          </div>
                        </TableCell> */}
												{/* <TableCell>
                          <span className="font-medium text-zinc-900">{c.totalPurchases}</span>
                          <span className="text-zinc-400 text-xs ml-1">pembelian</span>
                        </TableCell> */}
												<TableCell className="text-zinc-500 text-xs">
													{formatDateShort(c.createdAt)}
												</TableCell>
												<TableCell>
													<ChevronRight size={14} className="text-zinc-300" />
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
							{/* <Pagination
								page={page}
								pageSize={pageSize}
								total={total}
								onPageChange={setPage}
								onPageSizeChange={setPageSize}
							/> */}
						</>
					)}
				</Card>
			</main>
		</div>
	);
}
