UPDATE fields
  SET hint = 'ISO format (YYYY-MM-DD)'
  WHERE hint = 'ISO format'
    AND datatype_id = 'https://tropy.org/v1/tropy#date';
