DELETE FROM field_labels WHERE field_id IN (
  SELECT field_id FROM fields WHERE template_id IN (
    'https:/tropy.org/v1/templates/correspondence',
    'https:/tropy.org/v1/templates/dc'
  )
);

DELETE FROM fields WHERE template_id IN (
  'https:/tropy.org/v1/templates/correspondence',
  'https:/tropy.org/v1/templates/dc'
);

DELETE FROM templates WHERE template_id IN (
  'https:/tropy.org/v1/templates/correspondence',
  'https:/tropy.org/v1/templates/dc'
);
