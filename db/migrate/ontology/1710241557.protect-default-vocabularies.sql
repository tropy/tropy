UPDATE vocabularies
  SET protected = 1
  WHERE vocabulary_id IN (
    'http://www.openarchives.org/ore/terms/',
    'http://www.w3.org/2004/02/skos/core#',
    'http://www.europeana.eu/schemas/edm/'
  );
