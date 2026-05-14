const COMBINING_MARKS = /[̀-ͯ]/g

export const RESERVED_SLUGS = new Set([
  'current',
  'import',
  'items',
  'photos',
  'lists',
  'tags',
  'data',
  'notes',
  'transcriptions',
  'selections'
])

export function sanitizeSlug (input) {
  let slug = String(input ?? '')
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (!slug) return 'project'
  if (RESERVED_SLUGS.has(slug)) return `${slug}-project`

  return slug
}
