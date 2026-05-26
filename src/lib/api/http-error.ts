export class HttpError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = statusCode;

		// Optional: Removes the constructor call from the stack trace for cleaner logs
		Error.captureStackTrace(this, this.constructor);
	}
}
