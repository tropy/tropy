'use strict'

module.exports = {
  RDF: {
    type: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    Property: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#Property',
    Class: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#Class'
  },

  RDFS: {
    comment: 'http://www.w3.org/2000/01/rdf-schema#comment',
    isDefinedBy: 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy',
    label: 'http://www.w3.org/2000/01/rdf-schema#label'
  },

  OWL: {
    DatatypeProperty: 'http://www.w3.org/2002/07/owl#DatatypeProerty',
    Ontology: 'http://www.w3.org/2002/07/owl#Ontology',
    ObjectProperty: 'http://www.w3.org/2002/07/owl#ObjectProerty'
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
  },

  SKOS: {
    definition: 'http://www.w3.org/2004/02/skos/core#definition'
  }
}
