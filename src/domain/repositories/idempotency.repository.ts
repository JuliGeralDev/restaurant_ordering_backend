import { IdempotencyRecord } from '@/domain/entities/idempotency.entity';

export interface IdempotencyRepository {
  findByKey(key: string): Promise<IdempotencyRecord | null>;
  save(record: IdempotencyRecord): Promise<void>;
}