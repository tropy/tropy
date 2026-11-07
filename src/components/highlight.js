import { memo } from 'react'
import { useSelector } from 'react-redux'
import { selectMatcher } from '../slices/qr.js'

// Renders a text with the matches of the search query marked.
// The scope is the text's (see common/matcher.js), e.g. metadata.
export const Highlight = memo(({ scope, text }) => {
  let matcher = useSelector(selectMatcher)
  let ranges = matcher?.ranges(text, scope) ?? []

  if (ranges.length === 0)
    return text

  let parts = []
  let i = 0

  for (let [start, end] of ranges) {
    if (start > i) parts.push(text.slice(i, start))
    parts.push(<mark key={start}>{text.slice(start, end)}</mark>)
    i = end
  }

  if (i < text.length) parts.push(text.slice(i))

  return parts
})
