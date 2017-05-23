
CREATE TABLE templates (
  template_uri   TEXT     NOT NULL PRIMARY KEY,
  template_type  TEXT     NOT NULL DEFAULT 'item',
  protected      BOOLEAN  NOT NULL DEFAULT FALSE,
  created        NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified       NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CHECK (template_uri != ''),
  CHECK (template_type IN ('item', 'photo', 'selection'))
);


CREATE TABLE template_classes (
  template_uri  TEXT     NOT NULL REFERENCES templates ON DELETE CASCADE,
  class_uri     TEXT     NOT NULL REFERENCES classes,
  position      INTEGER
);

CREATE TABLE template_fields (
  field_id      INTEGER  PRIMARY KEY,
  template_uri  TEXT     NOT NULL REFERENCES templates ON DELETE CASCADE,
  property_uri  TEXT     NOT NULL REFERENCES properties,
  position      INTEGER
)
