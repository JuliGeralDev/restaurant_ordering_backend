import { validatePayloadSize } from './payload-validator';
import { handleError } from './error-response';
import { ValidationError } from '@/domain/errors/validation.error';
import { createValidationFailedEvent } from './validation-event.helper';
import { timelineRepository } from '@/infrastructure/container';

interface ApiHandlerOptions {
  requireBody?: boolean;
  validatePayload?: boolean;
  successStatusCode?: number;
  trackValidationFailures?: boolean;
}

type HandlerFunction = (event: any, parsedBody?: any) => Promise<any>;

/**
 * Centralized wrapper for Lambda handlers that provides request parsing,
 * validation, response building, and error handling.
 * 
 * @example
 * export const handler = (event: any) =>
 *   apiHandler(event, async (event, body) => {
 *     validator.required('userId', body.userId);
 *     return await processOrder(body);
 *   });
 */
export async function apiHandler(
  event: any,
  handler: HandlerFunction,
  options: ApiHandlerOptions = {}
): Promise<{ statusCode: number; body: string }> {
  const { 
    requireBody = true, 
    validatePayload = true, 
    successStatusCode = 200,
    trackValidationFailures = true 
  } = options;

  try {
    let parsedBody = undefined;

    if (requireBody) {
      if (validatePayload) {
        validatePayloadSize(event.body);
      }

      parsedBody = JSON.parse(event.body || '{}');
    }

    const result = await handler(event, parsedBody);

    return {
      statusCode: successStatusCode,
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    if (trackValidationFailures && error instanceof ValidationError) {
      try {
        const parsedBody = event.body ? JSON.parse(event.body) : {};
        const validationEvent = createValidationFailedEvent({
          orderId: parsedBody.orderId,
          userId: parsedBody.userId,
          errorMessage: error.message,
          validationType: 'field',
          attemptedAction: event.path || 'unknown',
          requestBody: parsedBody,
        });

        await timelineRepository.save(validationEvent);
      } catch (timelineError) {
        console.error('Failed to save validation event to timeline:', timelineError);
      }
    }

    return handleError(error);
  }
}
