import { v1, v3, v4, v5, v6, v7 } from 'uuid';
import type { UUID } from './types';

const toUUID = (id: string): UUID => id as UUID;

export const uuidv1 = (): UUID => toUUID(v1());
export const uuidv3 = (name: string, namespace: UUID): UUID => toUUID(v3(name, namespace));
export const uuidv4 = (): UUID => toUUID(v4());
export const uuidv5 = (name: string, namespace: UUID): UUID => toUUID(v5(name, namespace));
export const uuidv6 = (): UUID => toUUID(v6());
export const uuidv7 = (): UUID => toUUID(v7());

export const asUUID = (id: string): UUID => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) throw new Error('Invalid UUID format');
  return id as UUID;
};

export type { UUID };