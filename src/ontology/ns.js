const handler = {
  get(obj, prop) {
    return (prop in obj) ?
      obj[prop] :
      `${obj.BASE}${prop}`
  }
}

const ns = (BASE, props) =>
  new Proxy({ BASE, ...props }, handler)

export const dc = ns('http://purl.org/dc/elements/1.1/')
export const dcterms = ns('http://purl.org/dc/terms/')
export const owl = ns('http://www.w3.org/2002/07/owl#')
export const rdf = ns('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
export const rdfs = ns('http://www.w3.org/2000/01/rdf-schema#')
export const skos = ns('http://www.w3.org/2004/02/skos/core#')
export const tropy = ns('https://tropy.org/v1/tropy#')
export const xsd = ns('http://www.w3.org/2001/XMLSchema#')
export const vann = ns('http://purl.org/vocab/vann/')
