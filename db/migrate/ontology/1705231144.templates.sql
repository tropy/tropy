CREATE TABLE templates (
  template_id    TEXT     NOT NULL PRIMARY KEY,
  template_type  TEXT     NOT NULL DEFAULT 'item',
  name           TEXT     NOT NULL,
  description    TEXT,
  creator        TEXT,
  protected      BOOLEAN  NOT NULL DEFAULT FALSE,
  created        NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified       NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CHECK (template_id != ''),
  CHECK (template_type IN (
    'https://tropy.org/v1/tropy#Item',
    'https://tropy.org/v1/tropy#Photo',
    'https://tropy.org/v1/tropy#Selection'
  ))
  CHECK (name != '')
);


CREATE TABLE domains (
  domain_id     INTEGER   PRIMARY KEY,
  template_id   TEXT      NOT NULL REFERENCES templates ON DELETE CASCADE,
  class_id      TEXT      NOT NULL,
  position      INTEGER,

  CHECK (class_id != ''),
  UNIQUE (template_id, class_id)
);

CREATE TABLE fields (
  field_id      INTEGER   PRIMARY KEY,
  template_id   TEXT      NOT NULL REFERENCES templates ON DELETE CASCADE,
  property_id   TEXT      NOT NULL,
  datatype_id   TEXT      NOT NULL,
  required      BOOLEAN   NOT NULL DEFAULT FALSE,
  hint          TEXT,
  constant      TEXT,
  position      INTEGER,

  CHECK (datatype_id != ''),
  CHECK (property_id != ''),
  UNIQUE (template_id, property_id)
);
