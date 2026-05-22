type SuccessResponse<T> = {
	success: true;
	message: string;
	data: T;
};

type ErrorResponse = {
	success: false;
	message: string;
	issues: string[];
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export function successResponse<T>({
	message,
	data,
}: {
	message: string;
	data: T;
}): SuccessResponse<T> {
	return {
		success: true,
		message,
		data,
	};
}

export function errorResponse({
	message,
	issues,
}: {
	message: string;
	issues: string[];
}): ErrorResponse {
	return {
		success: false,
		message,
		issues,
	};
}
