import { validatePayloadSize } from './payload-validator';
import { handleError } from './error-response';

interface ApiHandlerOptions {
  requireBody?: boolean;
  validatePayload?: boolean;
  successStatusCode?: number;
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
  const { requireBody = true, validatePayload = true, successStatusCode = 200 } = options;

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
    return handleError(error);
  }
}
