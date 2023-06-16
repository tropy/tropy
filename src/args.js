const ARGS = Object.create({})

const proxy = new Proxy(ARGS, {
  get(_, prop) {
    return ARGS[prop]
  },
  set(_, prop, value) {
    if ((prop in ARGS))
      update({ [prop]: value })
    else
      throw new Error(`unknown argument: ${prop}`)
  }
})

export default proxy

export function parse() {
  let hash = window.location.hash.slice(1)
  Object.assign(ARGS, JSON.parse(decodeURIComponent(hash)))
  return proxy
}

export function update(args) {
  Object.assign(ARGS, args)
  window.location.hash = encodeURIComponent(JSON.stringify(ARGS))
  return proxy
}

export function clone() {
  return Object.fromEntries(Object.entries(ARGS))
}
