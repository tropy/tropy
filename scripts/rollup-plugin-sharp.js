import MagicString from 'magic-string'
import sharp from 'sharp'

const REQUIRE = [
  'try {',
  // eslint-disable-next-line no-template-curly-in-string
  '  sharp = require(`../src/build/Release/sharp-${runtimePlatform}-${version}.node`);',
  '} catch (err) {',
  '  errors.push(err);',
  '}'
].join('\n')

export default function sharpRequire ({ platformId }) {
  let transformed = false
  return {
    name: 'sharp-require-patch',
    transform (code, id) {
      if ((/sharp[\\/]dist[\\/]sharp\.mjs$/).test(id)) {
        transformed = true
        const requireStatementPos = code.indexOf(REQUIRE)
        if (requireStatementPos < 0) {
          throw new Error(
            `Could not find dynamic sharp require "${REQUIRE}"`
          )
        }

        const path = `./node/lib/sharp-${platformId}-${sharp.versions.sharp}.node`
        const REPLACEMENT = `sharp = require('${path}');`

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
    buildEnd (error) {
      if (!(error || transformed)) {
        throw new Error(
          'Could not find "sharp.js", was the file renamed?'
        )
      }
    }
  }
}
