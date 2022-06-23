import process from 'node:process'
import { parse } from '../../src/browser/args.js'

describe('args', () => {
  describe('--env', () => {
    it('falls back to node env', () => {
      expect(parse([]).opts)
        .to.have.property('env', process.env.NODE_ENV)
    })

    it('sets environment', () => {
      expect(parse(['--env', 'development']).opts)
        .to.have.property('env', 'development')
    })
  })
})
