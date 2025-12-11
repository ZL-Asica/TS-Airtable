import type { AirtableAttachment } from '@/types'

export function looksLikeAttachment(value: any): value is AirtableAttachment {
  return value
    && typeof value === 'object'
    && typeof value.id === 'string'
    && typeof value.url === 'string'
}
