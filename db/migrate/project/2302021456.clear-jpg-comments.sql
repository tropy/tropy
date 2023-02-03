DELETE
  FROM metadata
  WHERE property = 'http://purl.org/dc/elements/1.1/description'
  AND value_id IN (
    SELECT value_id
      FROM metadata_values
      WHERE datatype = 'http://www.w3.org/2001/XMLSchema#string'
        AND length(hex(text)) > min(length(text) * 8, 2048)
  );

DELETE
  FROM metadata_values
  WHERE value_id IN (
    SELECT v.value_id
      FROM metadata_values v
        LEFT OUTER JOIN metadata m
        USING (value_id)
      WHERE m.value_id IS NULL
  );
