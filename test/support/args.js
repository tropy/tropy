import { update } from '../../src/args'

if (process.type === 'renderer') {
  update({
    locale: 'en',
    env: process.env.NODE_ENV || 'test',
    debug: process.env.TROPY_DEBUG || process.env.DEBUG
  })
}
