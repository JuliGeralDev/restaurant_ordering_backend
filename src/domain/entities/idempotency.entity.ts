export interface IdempotencyRecord {
  key: string;
  response: any;
  createdAt: string;
}