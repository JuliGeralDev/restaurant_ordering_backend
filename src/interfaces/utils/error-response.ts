import { ValidationError } from '@/domain/errors/validation.error';
import { NotFoundError } from '@/domain/errors/not-found.error';

export interface ErrorResponse {
  error: string;
  message: string;
}

export function handleError(error: any): { statusCode: number; body: string } {
  // Check by instanceof and name for robustness
  if (error instanceof ValidationError || error.name === 'ValidationError') {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Validation failed',
        message: error.message,
      } as ErrorResponse),
    };
  }

  if (error instanceof NotFoundError || error.name === 'NotFoundError') {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'Not found',
        message: error.message,
      } as ErrorResponse),
    };
  }

  // Default to 500 for unexpected errors
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
    } as ErrorResponse),
  };
}
