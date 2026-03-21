import { ValidationError } from '@/domain/errors/validation.error';
import { NotFoundError } from '@/domain/errors/not-found.error';
import { IdempotencyConflictError } from '@/domain/errors/idempotency-conflict.error';

export interface ErrorResponse {
  error: string;
  message: string;
}

export function handleError(error: any): { statusCode: number; body: string } {
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

  if (error instanceof IdempotencyConflictError || error.name === 'IdempotencyConflictError') {
    return {
      statusCode: 422,
      body: JSON.stringify({
        error: 'Unprocessable entity',
        message: error.message,
      } as ErrorResponse),
    };
  }

  if (error.name === 'ConditionalCheckFailedException') {
    return {
      statusCode: 409,
      body: JSON.stringify({
        error: 'Conflict',
        message: 'Order has already been placed',
      } as ErrorResponse),
    };
  }

  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
    } as ErrorResponse),
  };
}
