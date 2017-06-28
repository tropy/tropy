
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
  CHECK (template_type IN ('item', 'photo', 'selection'))
  CHECK (name != '')
);


CREATE TABLE domains (
  template_id   TEXT      NOT NULL REFERENCES templates ON DELETE CASCADE,
  class_id      TEXT      NOT NULL REFERENCES classes,
  position      INTEGER
);

CREATE TABLE fields (
  field_id      INTEGER   PRIMARY KEY,
  template_id   TEXT      NOT NULL REFERENCES templates ON DELETE CASCADE,
  property_id   TEXT      NOT NULL REFERENCES properties,
  position      INTEGER
)
