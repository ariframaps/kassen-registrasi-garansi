import { DrizzleQueryError } from "drizzle-orm/errors";
import { NormalizedError } from "../normalize-error";

interface DatabaseErrorStructure {
	code?: string;
	detail?: string;
	column?: string;
	table?: string;
	message: string;
}

const drizzleError = (issues: string[], details: unknown): NormalizedError => ({
	type: "database",
	issues,
	details,
});

export function drizzleAdapter(error: DrizzleQueryError): NormalizedError {
	const dbError = error.cause as DatabaseErrorStructure | undefined;

	switch (dbError?.code) {
		case "23505":
			return drizzleError(["Data yang dimasukkan sudah terdaftar."], dbError);

		case "23503":
			return drizzleError(["Data memiliki relasi yang tidak valid."], dbError);

		case "23502":
			return drizzleError(
				[`Kolom '${dbError.column || "unknown"}' wajib diisi.`],
				dbError,
			);

		case "08000":
		case "08003":
		case "08006":
			return drizzleError(["Koneksi database sedang bermasalah."], dbError);

		default:
			return drizzleError(["Terjadi kesalahan database."], dbError);
	}
}
