//
// In the source file:
// 'react-dnd-html5-backend/dist/cjs/NativeDragSources/nativeTypesConfig'
//
// HTML match types are defined first and therefore take precedence when
// dropping something with multiple types. This causes, e.g., images
// dragged from a browser to be dropped as HTML snippets, when we really
// want the URL instead. We patch the native type config so that it
// will not match 'text/html' anymore (which Tropy does not handle).

import MagicString from 'magic-string'

const HTML_TYPES = "matchesTypes: ['Html', 'text/html']"
const REPLACEMENT = "matchesTypes: ['Html', 'matches-nothing']"

export default function reactDnd() {
  let transformed = false
  return {
    name: 'react-dnd-patch',
    transform(code, id) {
      if (id.endsWith('nativeTypesConfig.js')) {
        transformed = true
        const requireStatementPos = code.indexOf(HTML_TYPES)
        if (requireStatementPos < 0) {
          throw new Error(
            `Could not find expected HTML match types "${HTML_TYPES}"`
          )
        }
        const magicString = new MagicString(code)
        magicString.overwrite(
          requireStatementPos,
          requireStatementPos + HTML_TYPES.length,
          REPLACEMENT
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
