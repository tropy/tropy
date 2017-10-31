UPDATE fields
  SET datatype_id = 'https://tropy.org/v1/tropy#date'
  WHERE property_id = 'http://purl.org/dc/elements/1.1/date'
    AND template_id = 'https://tropy.org/v1/templates/generic';
