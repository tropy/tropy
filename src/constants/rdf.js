'use strict'

module.exports = {
  RDF: {
    ns: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    Property: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#Property',
    type: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
  },

  RDFS: {
    ns: 'http://www.w3.org/2000/01/rdf-schema#',
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
    ns: 'http://www.w3.org/2002/07/owl#',
    Class: 'http://www.w3.org/2002/07/owl#Class',
    DatatypeProperty: 'http://www.w3.org/2002/07/owl#DatatypeProperty',
    FunctionalProperty: 'http://www.w3.org/2002/07/owl#FunctionalProperty',
    InverseFunctionalProperty: 'http://www.w3.org/2002/07/owl#InverseFunctionalProperty',
    ObjectProperty: 'http://www.w3.org/2002/07/owl#ObjectProperty',
    Ontology: 'http://www.w3.org/2002/07/owl#Ontology',
    SymmetricProperty: 'http://www.w3.org/2002/07/owl#SymmetricProperty',
    TransitiveProperty: 'http://www.w3.org/2002/07/owl#TransitiveProperty'
  },

  DC: {
    ns: 'http://purl.org/dc/elements/1.1/',
    creator: 'http://purl.org/dc/elements/1.1/creator',
    date: 'http://purl.org/dc/elements/1.1/date',
    description: 'http://purl.org/dc/elements/1.1/description',
    publisher: 'http://purl.org/dc/elements/1.1/publisher',
    rights: 'http://purl.org/dc/elements/1.1/rights',
    source: 'http://purl.org/dc/elements/1.1/source',
    subject: 'http://purl.org/dc/elements/1.1/subject',
    title: 'http://purl.org/dc/elements/1.1/title',
    type: 'http://purl.org/dc/elements/1.1/type'
  },

  TERMS: {
    description: 'http://purl.org/dc/terms/description',
    publisher: 'http://purl.org/dc/terms/publisher',
    comment: 'http://purl.org/dc/terms/publisher',
    title: 'http://purl.org/dc/terms/title'
  },

  EXIF: {
    dateTime: 'http://www.w3.org/2003/12/exif/ns#dateTime',
    dateTimeOriginal: 'http://www.w3.org/2003/12/exif/ns#dateTimeOriginal',
    orientation: 'http://www.w3.org/2003/12/exif/ns#orientation'
  },

  SKOS: {
    definition: 'http://www.w3.org/2004/02/skos/core#definition'
  },

  VANN: {
    ns: 'http://purl.org/vocab/vann/',
    preferredNamespacePrefix: 'http://purl.org/vocab/vann/preferredNamespacePrefix',
    preferredNamespaceUri: 'http://purl.org/vocab/vann/preferredNamespaceUri'
  },

  TROPY: {
    ns: 'https://tropy.org/v1/tropy#',
    Item: 'https://tropy.org/v1/tropy#Item',
    List: 'https://tropy.org/v1/tropy#List',
    Note: 'https://tropy.org/v1/tropy#Note',
    Photo: 'https://tropy.org/v1/tropy#Photo',
    Selection: 'https://tropy.org/v1/tropy#Selection',
    Template: 'https://tropy.org/v1/tropy#Template',
    date: 'https://tropy.org/v1/tropy#date',
    item: 'https://tropy.org/v1/tropy#item',
    note: 'https://tropy.org/v1/tropy#note',
    photo: 'https://tropy.org/v1/tropy#photo',
    selection: 'https://tropy.org/v1/tropy#selection',
    template: 'https://tropy.org/v1/tropy#template'
  },

  XSD: {
    integer: 'http://www.w3.org/2001/XMLSchema#integer',
    string: 'http://www.w3.org/2001/XMLSchema#string'
  }
}
