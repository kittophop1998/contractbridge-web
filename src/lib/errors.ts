/** Normalised error shape shared by the mock and HTTP service implementations. */
export class ServiceError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    this.status = status;
  }
}

export function toServiceError(error: unknown): ServiceError {
  if (error instanceof ServiceError) return error;
  return new ServiceError(
    "UNKNOWN_ERROR",
    error instanceof Error ? error.message : "Something went wrong",
  );
}

export function notFound(code: string, message: string): ServiceError {
  return new ServiceError(code, message, 404);
}
