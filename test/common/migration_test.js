'use strict'

const Migration = __require('common/migration')

describe('Migration', () => {

  describe('constructor', () => {
    it('extracts version from path', () => {
      expect(new Migration('/tmp/1234.example.js'))
        .to.have.property('version', 1234)
    })
  })

})
