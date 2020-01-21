'use strict'

const handler = {
  get(obj, prop) {
    return (prop in obj) ?
      prop[obj] :
      `${obj.PREFIX}${prop}`
  }
}

const ns = (PREFIX, props) =>
  new Proxy({ PREFIX, ...props }, handler)

module.exports = {
  rdf: ns('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
  rdfs: ns('http://www.w3.org/2000/01/rdf-schema#'),
  tropy: ns('https://tropy.org/v1/tropy#')
}
