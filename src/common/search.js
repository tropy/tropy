// Search query grammar (v1), shared by the search field,
// tropy:// URLs and the API:
//
//   query  = term (whitespace term)*      implicit AND, per item
//   term   = [scope ":"] (phrase | word)
//   phrase = '"' chars ('"' | end)        unclosed: prefix
//   word   = non-space, non-quote chars   prefix
//
// Only the scope names below are recognized, so any other input
// (`a:b`, `1990-12`, `-0500`) is a word. A scope without a value
// (`tag:`, e.g. while typing) is no term. Too many terms fail.

const SCOPE = {
  tag: 'tag',
  note: 'note',
  transcription: 'transcription',
  tr: 'transcription',
  metadata: 'metadata',
  meta: 'metadata'
}

// Each term is its own query (models/item.js: term).
const MAX_TERMS = 32

// The grammar, for the API docs (OpenAPI, MCP).
export const SYNTAX =
  'Words and "quoted phrases"; an item matches when every term ' +
  'matches somewhere in it: its metadata, its photos\' and selections\' ' +
  'metadata, notes and transcriptions, or its tag names. ' +
  'Words match as prefixes, phrases exactly; an unclosed quote ' +
  'extends to the end of the query and matches as a prefix. ' +
  'Matching ignores case and diacritics, without stemming. ' +
  'A scope limits a term to tag names (tag:, as a substring), ' +
  'notes (note:), transcriptions (transcription: or tr:) ' +
  'or metadata (metadata: or meta:), e.g. tag:letter or ' +
  'meta:"Box 3". Other text with a colon is a word (a:b). ' +
  `At most ${MAX_TERMS} terms; a scope without a term is ignored.`

// A scope (optional), then a phrase (closing quote optional) or a word.
// Neither a phrase nor a word can contain a quote.
const TERM =
  /(?:(tag|note|transcription|tr|metadata|meta):)?(?:"([^"]*)("?)|([^\s"]+))/gi

// A scope without a value, matched as a word: no term.
const EMPTY = /^(tag|note|transcription|tr|metadata|meta):$/i

// Returns the terms of a query and its errors.
// Duplicate terms are dropped.
export function parse (query = '') {
  let terms = new Map()
  let errors = []

  for (let m of query.matchAll(TERM)) {
    let [match, name, phrase, end, word] = m
    let error = { offset: m.index, length: match.length }

    if (word != null && EMPTY.test(word))
      continue

    let scope = (name == null) ? 'any' : SCOPE[name.toLowerCase()]
    let term = (word != null)
      ? { text: word, phrase: false, prefix: true, scope }
      : { text: phrase, phrase: true, prefix: !end, scope }

    if (term.text.trim() === '')
      continue

    // Bare words and unclosed phrases are the same prefix query.
    let key = `${scope}:${term.prefix}:${term.text.toLowerCase()}`
    if (terms.has(key))
      continue

    if (terms.size === MAX_TERMS) {
      errors.push({ code: 'too-many-terms', ...error })
      break
    }

    terms.set(key, term)
  }

  return { terms: [...terms.values()], errors }
}

// Returns the canonical text of the terms.
export function serialize (terms) {
  return terms.map(({ text, phrase, prefix, scope }) => {
    let s = (scope === 'any') ? '' : `${scope}:`

    if (!phrase)
      return s + text

    return `${s}"${text}${prefix ? '' : '"'}`
  }).join(' ')
}
