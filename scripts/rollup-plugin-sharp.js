//
// In the source file:
// 'sharp/lib/sharp.js'
//
// Replace dynamically computed path to native module with a static one.

import MagicString from 'magic-string'

const REQUIRE = '`../build/Release/sharp-${platformAndArch}.node`'

export default function sharpRequire({ platformId }) {
  let transformed = false
  return {
    name: 'sharp-require-patch',
    transform(code, id) {
      if (id.endsWith('sharp/lib/sharp.js')) {
        transformed = true
        const requireStatementPos = code.indexOf(REQUIRE)
        if (requireStatementPos < 0) {
          throw new Error(
            `Could not find dynamic sharp require "${REQUIRE}"`
          )
        }
        const REPLACEMENT = REQUIRE
          .replaceAll('`', "'")
          .replace('${platformAndArch}', platformId)

        const magicString = new MagicString(code)
        magicString.overwrite(
          requireStatementPos,
          requireStatementPos + REQUIRE.length,
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
          'Could not find "sharp.js", was the file renamed?'
        )
      }
    }
  }
}
