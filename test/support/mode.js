import process from 'node:process'

process.env.NODE_ENV = 'test'
process.env.BLUEBIRD_DEBUG = 'true'

if (process.type === 'renderer') {
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true }
}
