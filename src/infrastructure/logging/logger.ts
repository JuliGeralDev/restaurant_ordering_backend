import { maskPII } from './pii-mask.util';

export function logSafe(message: string, payload?: any) {
  if (!payload) {
    console.log(message);
    return;
  }

  const safePayload = maskPII(payload);

  console.log(message, JSON.stringify(safePayload));
}