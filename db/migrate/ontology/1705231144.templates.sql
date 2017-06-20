
CREATE TABLE templates (
  template_id    TEXT     NOT NULL PRIMARY KEY,
  template_type  TEXT     NOT NULL DEFAULT 'item',
  protected      BOOLEAN  NOT NULL DEFAULT FALSE,
  created        NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted        NUMERIC,
  modified       NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CHECK (template_id != ''),
  CHECK (template_type IN ('item', 'photo', 'selection'))
);


CREATE TABLE template_classes (
  template_id   TEXT     NOT NULL REFERENCES templates ON DELETE CASCADE,
  class_id      TEXT     NOT NULL REFERENCES classes,
  position      INTEGER
);

CREATE TABLE template_fields (
  field_id      INTEGER  PRIMARY KEY,
  template_id   TEXT     NOT NULL REFERENCES templates ON DELETE CASCADE,
  property_id   TEXT     NOT NULL REFERENCES properties,
  position      INTEGER
)
