'use strict'


const decode = decodeURIComponent
const encode = encodeURIComponent

function parse() {
  const hash = window.location.hash.slice(1)

  window.ARGS = JSON.parse(decode(hash))
  process.env.NODE_ENV = ARGS.environment

  return window.ARGS
}

function update(hash) {
  Object.assign(window.ARGS, hash)
  window.location.hash = encode(JSON.stringify(ARGS))
}

module.exports = {
  parse,
  update
}
