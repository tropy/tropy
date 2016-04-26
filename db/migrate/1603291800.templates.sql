CREATE TABLE properties (
  property_id    TEXT  NOT NULL PRIMARY KEY,
  property_name  TEXT  NOT NULL COLLATE NOCASE,
  type_name      TEXT  NOT NULL COLLATE NOCASE REFERENCES types

  CHECK (property_id != ''),
  CHECK (property_name != '')
);

CREATE TABLE types (
  type_name    TEXT  NOT NULL COLLATE NOCASE PRIMARY KEY,
  type_schema  TEXT  NOT NULL UNIQUE

  CHECK (type_name != ''),
  CHECK (type_schema != '')
) WITHOUT ROWID;

INSERT INTO types (type_name, type_schema) VALUES
  ('text', 'https://schema.org/Text'),
  ('datetime', 'https://schema.trop.io/datetime'),
  ('name', 'https://schema.trop.io/name'),
  ('boolean', 'https://schema.org/Boolean'),
  ('number', 'https://schema.org/Number');


CREATE TABLE templates (
  template_id    TEXT     NOT NULL PRIMARY KEY,
  template_name  TEXT     NOT NULL COLLATE NOCASE,
  created_at     NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CHECK (template_id != ''),
  CHECK (template_name != '')
) WITHOUT ROWID;

CREATE TABLE template_data (
  template_id    TEXT     NOT NULL REFERENCES templates ON DELETE CASCADE,
  property_id    TEXT     NOT NULL REFERENCES properties,
  position       INTEGER  NOT NULL DEFAULT 0,
  default_value,
  constraints,

  PRIMARY KEY (template_id, property_id),
  UNIQUE (template_id, position)
);
