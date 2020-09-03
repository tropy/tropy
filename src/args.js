const decode = decodeURIComponent
const encode = encodeURIComponent

let ARGS = {}
export default ARGS

export function parse() {
  let hash = window.location.hash.slice(1)

  Object.assign(ARGS, JSON.parse(decode(hash)))
  // process.env.NODE_ENV = ARGS.env

  return ARGS
}

export function update(hash) {
  Object.assign(ARGS, hash)
  window.location.hash = encode(JSON.stringify(ARGS))
}
