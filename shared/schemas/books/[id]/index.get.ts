import type { BaseBookResponse } from '../../base';

export type BookGetResponse = BaseBookResponse & { liked: boolean };
