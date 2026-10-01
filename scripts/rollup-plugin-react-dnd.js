import MagicString from 'magic-string'


// In the source file:
// 'react-dnd-html5-backend/dist/NativeDragSources/nativeTypesConfig.js'
//
// HTML match types are defined first and therefore take precedence when
// dropping something with multiple types. This causes, e.g., images
// dragged from a browser to be dropped as HTML snippets, when we really
// want the URL instead. We patch the native type config so that it
// will not match 'text/html' anymore (which Tropy does not handle).
const HTML_TYPES = /matchesTypes:\s*\[\s*'Html',\s*'text\/html'\s*\]/
const HTML_TYPES_REPLACEMENT = "matchesTypes: ['Html', 'matches-nothing']"

// The exposed dataTransfer.items is refreshed on every drag event, but
// it is a live list which the browser empties after each event. Since
// collecting props (and thus canDrop) may also happen outside of drag
// events, we expose a copy using primitives only.
const EXPOSE_ITEMS = /items:\s*\(dataTransfer\)\s*=>\s*dataTransfer\.items/
const EXPOSE_ITEMS_REPLACEMENT =
  'items: (dataTransfer) => Array.from(dataTransfer.items, ({ kind, type }) => ({ kind, type }))'

function replace (code, magicString, pattern, replacement) {
  let match = pattern.exec(code)
  if (match == null) {
    throw new Error(`Could not find expected pattern ${pattern}`)
  }
  magicString.overwrite(
    match.index,
    match.index + match[0].length,
    replacement
  )
}

export default function reactDnd () {
  let transformed = false
  return {
    name: 'react-dnd-patch',
    transform (code, id) {
      if (id.endsWith('nativeTypesConfig.js')) {
        transformed = true
        let magicString = new MagicString(code)
        replace(code, magicString, HTML_TYPES, HTML_TYPES_REPLACEMENT)
        replace(code, magicString, EXPOSE_ITEMS, EXPOSE_ITEMS_REPLACEMENT)
        return {
          code: magicString.toString(),
          map: magicString.generateMap({ hires: true })
        }
      }
    },
    buildEnd (error) {
      if (!(error || transformed)) {
        throw new Error(
          'Could not find "nativeTypesConfig.js", was the file renamed?'
        )
      }
    }
  }
}
