process.env.NODE_ENV = 'test'
process.env.BLUEBIRD_DEBUG = 'true'

if (process.type === 'renderer') {
  global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true }
}
