type SuccessResponse<T> = {
	success: true;
	data: T;
	error?: never;
};

type ErrorResponse = {
	success: false;
	data?: never;
	error: string[];
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export function successResponse<T>(data: T): ApiResponse<T> {
	return {
		success: true,
		data,
	};
}

export function errorResponse(error: string[]): ApiResponse<never> {
	return {
		success: false,
		error,
	};
}
