import { maskPII } from './pii-mask.util';

/**
 * Logs a message with optional payload after masking any Personally Identifiable Information (PII).
 * 
 * This function ensures that sensitive data is never exposed in logs by applying PII masking
 * before outputting the payload. If no payload is provided, only the message is logged.
 * 
 */
export function logSafe(message: string, payload?: any) {
  if (!payload) {
    console.log(message);
    return;
  }

  const safePayload = maskPII(payload);

  console.log(message, JSON.stringify(safePayload));
}