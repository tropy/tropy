const ARGS = {}

export default ARGS

export function parse() {
  let hash = window.location.hash.slice(1)
  Object.assign(ARGS, JSON.parse(decodeURIComponent(hash)))
  return ARGS
}

export function update(hash) {
  Object.assign(ARGS, hash)
  window.location.hash = encodeURIComponent(JSON.stringify(ARGS))
  return ARGS
}

parse()
