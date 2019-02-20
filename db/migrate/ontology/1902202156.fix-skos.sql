REPLACE INTO vocabularies VALUES(
  'http://www.w3.org/2004/02/skos/core#',
  'skos',
  '2019-02-20 20:51:13',
  NULL,
  1,
  'SKOS Vocabulary',
  'An RDF vocabulary for describing the basic structure and content of concept schemes such as thesauri, classification schemes, subject heading lists, taxonomies, ''folksonomies'', other types of controlled vocabulary, and also concept schemes embedded in glossaries and terminologies.',
  NULL,
  NULL);

UPDATE datatypes
  SET vocabulary_id = 'http://www.w3.org/2004/02/skos/core#'
  WHERE vocabulary_id = 'http://www.w3.org/2004/02/skos/core';

UPDATE properties
  SET vocabulary_id = 'http://www.w3.org/2004/02/skos/core#'
  WHERE vocabulary_id = 'http://www.w3.org/2004/02/skos/core';

UPDATE classes
  SET vocabulary_id = 'http://www.w3.org/2004/02/skos/core#'
  WHERE vocabulary_id = 'http://www.w3.org/2004/02/skos/core';

DELETE
  FROM vocabularies
  WHERE vocabulary_id = 'http://www.w3.org/2004/02/skos/core';
