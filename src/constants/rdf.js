'use strict'

module.exports = {
  RDF: {
    Property: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#Property',
    type: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
  },

  RDFS: {
    Class: 'http://www.w3.org/2000/01/rdf-schema#Class',
    comment: 'http://www.w3.org/2000/01/rdf-schema#comment',
    Datatype: 'http://www.w3.org/2000/01/rdf-schema#Datatype',
    domain: 'http://www.w3.org/2000/01/rdf-schema#domain',
    isDefinedBy: 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy',
    label: 'http://www.w3.org/2000/01/rdf-schema#label',
    range: 'http://www.w3.org/2000/01/rdf-schema#range',
    seeAlso: 'http://www.w3.org/2000/01/rdf-schema#seeAlso'
  },

  OWL: {
    Class: 'http://www.w3.org/2002/07/owl#Class',
    DatatypeProperty: 'http://www.w3.org/2002/07/owl#DatatypeProerty',
    FunctionalProperty: 'http://www.w3.org/2002/07/owl#FunctionalProperty',
    InverseFunctionalProperty: 'http://www.w3.org/2002/07/owl#InverseFunctionalProperty',
    ObjectProperty: 'http://www.w3.org/2002/07/owl#ObjectProperty',
    Ontology: 'http://www.w3.org/2002/07/owl#Ontology',
    SymmetricProperty: 'http://www.w3.org/2002/07/owl#SymmetricProperty',
    TransitiveProperty: 'http://www.w3.org/2002/07/owl#TransitiveProperty'
  },

  DC: {
    creator: 'http://purl.org/dc/elements/1.1/creator',
    date: 'http://purl.org/dc/elements/1.1/date',
    description: 'http://purl.org/dc/elements/1.1/description',
    publisher: 'http://purl.org/dc/elements/1.1/publisher',
    rights: 'http://purl.org/dc/elements/1.1/rights',
    source: 'http://purl.org/dc/elements/1.1/source',
    title: 'http://purl.org/dc/elements/1.1/title',
    type: 'http://purl.org/dc/elements/1.1/type'
  },

  DCT: {
    description: 'http://purl.org/dc/terms/description',
    publisher: 'http://purl.org/dc/terms/publisher',
    comment: 'http://purl.org/dc/terms/publisher',
    title: 'http://purl.org/dc/terms/title'
  },

  SKOS: {
    definition: 'http://www.w3.org/2004/02/skos/core#definition'
  },

  VANN: {
    preferredNamespacePrefix: 'http://purl.org/vocab/vann/preferredNamespacePrefix'
  }
}
