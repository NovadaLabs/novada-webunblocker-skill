export const ERROR_CODES = {
  API_KEY_MISSING: "API_KEY_MISSING",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UPSTREAM_TIMEOUT: "UPSTREAM_TIMEOUT",
  UPSTREAM_HTTP_ERROR: "UPSTREAM_HTTP_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR"
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class AppError extends Error {
  public readonly code: ErrorCode;

  public readonly status?: number;

  public readonly details?: unknown;

  public constructor(
    code: ErrorCode,
    message: string,
    options?: { status?: number; details?: unknown; cause?: unknown }
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = options?.status;
    this.details = options?.details;
    if (options?.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(ERROR_CODES.NETWORK_ERROR, error.message, {
      cause: error
    });
  }

  return new AppError(ERROR_CODES.NETWORK_ERROR, "Unknown error occurred.");
}
