// Finds where the terms of a search query (see search.js) match
// in a text, for highlighting. The search itself runs in FTS5
// (unicode61 remove_diacritics 2); this does not reproduce it,
// but normalizes at least as much, so that every match the search
// finds can be marked. Marking more is harmless: only the items
// the search found are shown (e.g. Greek accents are removed here,
// not in the index). Not marked: a term matching inside a word that
// the index splits at marks (e.g. Devanagari vowel signs).

// Token characters: letters, numbers, marks and private use.
const TOKEN = /[\p{L}\p{N}\p{M}\p{Co}]/u
const MARKS = /\p{M}/gu

// Folds a character: case folded (approximated by upper then lower
// case, unless that changes its length, as for ß), without marks.
const fold = (c) => {
  let upper = c.toUpperCase()

  return ((upper.length === c.length) ? upper : c)
    .toLowerCase()
    .normalize('NFD')
    .replace(MARKS, '')
}

// Returns the tokens of a text: { start, end, text },
// with offsets into the text and the folded token text.
export function tokenize (text) {
  let tokens = []
  let token = null
  let i = 0

  for (let c of text) {
    if (TOKEN.test(c)) {
      if (token == null)
        tokens.push(token = { start: i, end: i, text: '' })

      token.text += fold(c)
      token.end = i + c.length

    } else {
      token = null
    }

    i += c.length
  }

  return tokens
}

// Folds a text as tokens are (case, marks), keeping every character:
// tag names match terms folded so, in the search (models/item.js: term)
// as in the highlights.
export const foldText = (text) => {
  let folded = ''
  for (let c of text) folded += fold(c)
  return folded
}

// The end in the text of the first `length` folded characters
// of a token, with the marks that follow them.
const prefixEnd = (text, { start, end }, length) => {
  let n = 0
  let i = start

  for (let c of text.slice(start, end)) {
    let folded = fold(c).length

    if (n >= length && folded > 0)
      break

    n += folded
    i += c.length
  }

  return i
}

// Ranges where a term's tokens match consecutive tokens of the text:
// the last as a prefix for words and unclosed phrases, marking only
// the matched part of it.
function * tokenMatches (text, tokens, { words, prefix }) {
  let n = words.length

  for (let i = 0; i + n <= tokens.length; ++i) {
    let j = 0

    while (j < n - 1 && tokens[i + j].text === words[j]) ++j

    if (j < n - 1)
      continue

    let last = tokens[i + j]

    if (prefix ?
      last.text.startsWith(words[j]) :
      last.text === words[j])
      yield [tokens[i].start, prefix ?
        prefixEnd(text, last, words[j].length) :
        last.end]
  }
}

// Ranges where a term occurs in the text as a folded substring
// (tag names). Folded positions map back to the text; a match ends
// before the next character that folds to something, so marks that
// follow its last character are part of it.
function * substringMatches (text, { pattern }) {
  if (!pattern) return

  let folded = ''
  let offsets = []
  let i = 0

  for (let c of text) {
    let f = fold(c)
    for (let k = 0; k < f.length; ++k) offsets.push(i)
    folded += f
    i += c.length
  }

  offsets.push(text.length)

  let at = folded.indexOf(pattern)

  while (at !== -1) {
    yield [offsets[at], offsets[at + pattern.length]]
    at = folded.indexOf(pattern, at + 1)
  }
}

// Sorts ranges and merges those that overlap or touch.
const merge = (ranges) => {
  ranges.sort((a, b) => a[0] - b[0])

  let merged = []

  for (let [start, end] of ranges) {
    let last = merged.at(-1)

    if (last != null && start <= last[1])
      last[1] = Math.max(last[1], end)
    else
      merged.push([start, end])
  }

  return merged
}

// Returns a matcher for the terms of a parsed query.
// A component passes the scope of its text (metadata, note,
// transcription or tag): only unscoped terms and the terms of that
// scope apply. Tag names match terms as substrings, other texts
// by tokens. Terms without tokens (only punctuation) match nothing.
export function createMatcher (terms = []) {
  terms = terms.map(term => ({
    ...term,
    words: tokenize(term.text).map(t => t.text),
    pattern: foldText(term.text)
  }))

  let applicable = (scope) =>
    terms.filter(t => t.scope === 'any' || t.scope === scope)

  return {
    // Returns the merged [start, end) ranges of all matches.
    ranges (text, scope) {
      if (!text) return []

      let ranges = []

      if (scope === 'tag') {
        for (let term of applicable(scope))
          ranges.push(...substringMatches(text, term))

      } else {
        let tokens = tokenize(text)

        for (let term of applicable(scope))
          if (term.words.length > 0)
            ranges.push(...tokenMatches(text, tokens, term))
      }

      return merge(ranges)
    },

    test (text, scope) {
      return this.ranges(text, scope).length > 0
    }
  }
}

// Cuts a text down to its matches, e.g. for a preview:
// each range with about `context` characters around it,
// cut at whitespace where possible, joined by ellipses,
// until about `size` characters; the last window
// takes the rest of the size. Ranges past the size are left out.
// Returns the snippet and the ranges shifted into it.
export function snippet (text, ranges, { size = 280, context = 30 } = {}) {
  let windows = []
  let length = 0

  for (let [start, end] of ranges) {
    if (length >= size) break

    let from = wordStart(text, Math.max(0, start - context), start)
    let to = wordEnd(text, Math.min(text.length, end + context), end)
    let last = windows.at(-1)

    if (last != null && from <= last.to) {
      length += Math.max(0, to - last.to)
      last.to = Math.max(last.to, to)
    } else {
      windows.push({ from, to })
      length += to - from
    }
  }

  let last = windows.at(-1)

  if (last == null)
    return { text, ranges }

  if (length < size)
    last.to = wordEnd(
      text, Math.min(text.length, last.to + size - length), last.to)

  let out = ''
  let shifted = []

  for (let { from, to } of windows) {
    if (out) out += ' … '
    else if (from > 0) out += '…'

    let offset = out.length - from

    for (let [start, end] of ranges)
      if (start >= from && end <= to)
        shifted.push([start + offset, end + offset])

    out += text.slice(from, to)
  }

  if (last.to < text.length) out += '…'

  return { text: out, ranges: shifted }
}

// The first word start in text[i, limit), else i.
const wordStart = (text, i, limit) => {
  if (i === 0 || /\s/.test(text[i - 1])) return i
  let m = /\s+/.exec(text.slice(i, limit))
  return (m == null) ? i : i + m.index + m[0].length
}

// The last word end in text(limit, i], else i.
const wordEnd = (text, i, limit) => {
  if (i >= text.length || /\s/.test(text[i])) return i
  let ws = text.slice(limit, i).search(/\s+\S*$/)
  return (ws === -1) ? i : limit + ws
}
