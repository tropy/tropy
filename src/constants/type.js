'use strict'

const { TROPY, XSD } = require('./rdf')

module.exports = {
  DATE: TROPY.date,
  NUMBER: XSD.integer,
  TEXT: XSD.string
}
