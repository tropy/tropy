'use strict'

module.exports = {
  RDF: {
    type: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    Property: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#Property'
  },

  RDFS: {
    comment: 'http://www.w3.org/2000/01/rdf-schema#comment',
    isDefinedBy: 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy',
    label: 'http://www.w3.org/2000/01/rdf-schema#label'
  },

  DC: {
    description: 'http://purl.org/dc/elements/1.1/description',
    title: 'http://purl.org/dc/elements/1.1/title'
  },

  DCT: {
    description: 'http://purl.org/dc/terms/description',
    publisher: 'http://purl.org/dc/terms/publisher',
    comment: 'http://purl.org/dc/terms/publisher',
    title: 'http://purl.org/dc/terms/title'
  }
}
