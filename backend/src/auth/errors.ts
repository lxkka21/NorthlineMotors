export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Request validation failed') {
    super(400, 'VALIDATION_ERROR', message);
  }
}

export class AuthenticationError extends AppError {
  constructor(code: 'INVALID_CREDENTIALS' | 'INVALID_TOKEN', message: string) {
    super(401, code, message);
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super(403, 'FORBIDDEN', 'You do not have permission to perform this action');
  }
}

export class ConflictError extends AppError {
  constructor() {
    super(409, 'EMAIL_ALREADY_EXISTS', 'An account with this email already exists');
  }
}

