//
// In the source file:
// 'sharp/lib/sharp.js'
//
// Replace dynamically computed path to native module with a static one.

import MagicString from 'magic-string'

const REQUIRE = 'sharp = require(path);'
const PATHS = /const paths = \[[^\]]+\];/

export default function sharpRequire({ platformId }) {
  let transformed = false
  return {
    name: 'sharp-require-patch',
    transform(code, id) {
      if ((/sharp[\\/]lib[\\/]sharp\.js$/).test(id)) {
        transformed = true
        const requireStatementPos = code.indexOf(REQUIRE)
        if (requireStatementPos < 0) {
          throw new Error(
            `Could not find dynamic sharp require "${REQUIRE}"`
          )
        }

        const path = `../src/build/Release/sharp-${platformId}.node`
        const REPLACEMENT = REQUIRE.replace('path', `'${path}'`)

        const magicString = new MagicString(code)
        magicString.overwrite(
          requireStatementPos,
          requireStatementPos + REQUIRE.length,
          REPLACEMENT
        )

        const pathsMatch = PATHS.exec(code)

        if (!pathsMatch) {
          throw new Error('Could not find sharp require paths')
        }

        magicString.overwrite(
          pathsMatch.index,
          pathsMatch.index + pathsMatch[0].length,
          `const paths = ['${path}'];`
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
