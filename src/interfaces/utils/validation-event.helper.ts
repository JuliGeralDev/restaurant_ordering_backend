import { TimelineEvent } from '@/domain/entities/timeline-event.entity';
import { randomUUID } from 'crypto';

interface ValidationFailedDetails {
  orderId?: string;
  userId?: string;
  errorMessage: string;
  validationType: 'payload' | 'field' | 'business';
  failedFields?: string[];
  attemptedAction?: string;
  requestBody?: any;
}

/**
 * Creates a VALIDATION_FAILED timeline event for tracking validation errors.
 */
export function createValidationFailedEvent(
  details: ValidationFailedDetails,
  correlationId?: string
): TimelineEvent {
  return {
    eventId: randomUUID(),
    timestamp: new Date().toISOString(),
    orderId: details.orderId || 'unknown',
    userId: details.userId || 'unknown',
    type: 'VALIDATION_FAILED',
    source: 'api',
    correlationId: correlationId || randomUUID(),
    payload: {
      errorMessage: details.errorMessage,
      validationType: details.validationType,
      failedFields: details.failedFields || [],
      attemptedAction: details.attemptedAction,
      requestBody: details.requestBody,
    },
  };
}
