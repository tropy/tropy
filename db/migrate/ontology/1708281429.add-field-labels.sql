CREATE TABLE field_labels (
  field_id  INTEGER  NOT NULL REFERENCES fields ON DELETE CASCADE,
  language  TEXT     NOT NULL COLLATE NOCASE,
  label     TEXT     NOT NULL,

  PRIMARY KEY (field_id, language),

  CHECK (
    label != '' AND language != '' AND language = trim(lower(language))
  )
) WITHOUT ROWID;
