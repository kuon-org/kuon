export type ApiErrorDetails = unknown;
export type ValidationFieldErrors = Record<string, string[]>;

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorDetails;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: ApiErrorDetails,
  ) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(fields: ValidationFieldErrors, message = "Validation failed") {
    super(400, "VALIDATION_ERROR", message, { fields });
    this.name = "ValidationError";
  }
}
