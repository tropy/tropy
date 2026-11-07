import { useSelector } from 'react-redux'
import { selectMatcher } from '../slices/qr.js'
import { ranges } from '../format.js'

// Renders a text with the given [start, end) ranges marked,
// e.g. search matches or the match of a completion.
export const Highlight = ({ text, ranges }) => {
  if (!text || !ranges?.length)
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
}

// The ranges of the search query's matches
// in the displayed metadata value (see format.js).
// Null without a value, e.g. for cells that are not highlighted.
export const useSearchRanges = (value, type) => {
  let matcher = useSelector(selectMatcher)
  return ranges(value, type, matcher)
}
