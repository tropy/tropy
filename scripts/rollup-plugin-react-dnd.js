import MagicString from 'magic-string'


// In the source file:
// 'react-dnd-html5-backend/dist/cjs/NativeDragSources/nativeTypesConfig'
//
// HTML match types are defined first and therefore take precedence when
// dropping something with multiple types. This causes, e.g., images
// dragged from a browser to be dropped as HTML snippets, when we really
// want the URL instead. We patch the native type config so that it
// will not match 'text/html' anymore (which Tropy does not handle).
const HTML_TYPES = "matchesTypes: ['Html', 'text/html']"
const HTML_TYPES_REPLACEMENT = "matchesTypes: ['Html', 'matches-nothing']"

// The exposed dataTransfer.items is collected on dragenter but that
// object is reset by the browser later on successive dragover events.
// Newer versions of react-dnd update the properties for every event;
// here we solve it by making a copy using primitives only.
const EXPOSE_ITEMS = 'return dataTransfer.items'
const EXPOSE_ITEMS_REPLACEMENT = 'return Array.from(dataTransfer.items).map(({ kind, type }) => ({ kind, type }))'

export default function reactDnd() {
  let transformed = false
  return {
    name: 'react-dnd-patch',
    transform(code, id) {
      if (id.endsWith('nativeTypesConfig.js')) {
        transformed = true
        let magicString = new MagicString(code)
        let pos = code.indexOf(HTML_TYPES)
        if (pos < 0) {
          throw new Error(
            `Could not find expected HTML match types "${HTML_TYPES}"`
          )
        }
        magicString.overwrite(
          pos,
          pos + HTML_TYPES.length,
          HTML_TYPES_REPLACEMENT
        )
        pos = code.indexOf(EXPOSE_ITEMS)
        if (pos < 0) {
          throw new Error(
            `Could not find expected exposed dataTransfer.items "${EXPOSE_ITEMS}"`
          )
        }
        magicString.overwrite(
          pos,
          pos + EXPOSE_ITEMS.length,
          EXPOSE_ITEMS_REPLACEMENT
        )
        return {
          code: magicString.toString(),
          map: magicString.generateMap({ hires: true })
        }
      }
    },
    buildEnd(error) {
      if (!(error || transformed)) {
        throw new Error(
          'Could not find "nativeTypesConfig.js", was the file renamed?'
        )
      }
    }
  }
}
