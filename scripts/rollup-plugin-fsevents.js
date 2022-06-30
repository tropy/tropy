// This plugin is taken from Rollup's build plugins:
// https://github.com/rollup/rollup/blob/master/build-plugins/conditional-fsevents-import.js
//
// The MIT License (MIT)
// Copyright (c) 2017 Rollup Contributors

import MagicString from 'magic-string'

const FSEVENTS_REQUIRE = "require('fsevents')"
const REPLACEMENT = "require('../../../src/common/watch.js').getFsEvents()"

export default function fsEvents() {
  let transformed = false
  return {
    name: 'conditional-fs-events-import',
    transform(code, id) {
      if (id.endsWith('fsevents-handler.js')) {
        transformed = true
        const requireStatementPos = code.indexOf(FSEVENTS_REQUIRE)
        if (requireStatementPos < 0) {
          throw new Error(
            `Could not find expected fsevents import "${FSEVENTS_REQUIRE}"`
          )
        }
        const magicString = new MagicString(code)
        magicString.overwrite(
          requireStatementPos,
          requireStatementPos + FSEVENTS_REQUIRE.length,
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
          'Could not find "fsevents-handler.js", was the file renamed?'
        )
      }
    }
  }
}
