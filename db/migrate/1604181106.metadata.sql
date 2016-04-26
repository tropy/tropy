CREATE TABLE metadata (
  metadata_id  INTEGER  PRIMARY KEY,
  id           INTEGER  NOT NULL REFERENCES subjects ON DELETE CASCADE,
  property_id  TEXT     NOT NULL REFERENCES properties,
  value_id     INTEGER  NOT NULL REFERENCES metadata_values,
  position     INTEGER  NOT NULL DEFAULT 0,

  UNIQUE (id, position)

);

CREATE TABLE metadata_values (
  value_id       INTEGER  NOT NULL PRIMARY KEY,
  value                   NOT NULL,
  language_code  TEXT     COLLATE NOCASE REFERENCES languages,

  UNIQUE (value, language_code)
);

CREATE TABLE properties (
  property_id    TEXT  NOT NULL PRIMARY KEY,
  property_name  TEXT  NOT NULL COLLATE NOCASE,
  type_name      TEXT  NOT NULL COLLATE NOCASE REFERENCES types
);

CREATE TABLE types (
  type_name    TEXT  NOT NULL COLLATE NOCASE PRIMARY KEY,
  type_schema  TEXT  NOT NULL UNIQUE
) WITHOUT ROWID;

INSERT INTO types (type_name, type_schema) VALUES
  ('text', 'https://schema.org/Text'),
  ('datetime', 'https://schema.trop.io/datetime'),
  ('name', 'https://schema.trop.io/name'),
  ('boolean', 'https://schema.org/Boolean'),
  ('number', 'https://schema.org/Number');



CREATE TABLE templates (
  template_id TEXT NOT NULL PRIMARY KEY,
  template_name TEXT NOT NULL COLLATE NOCASE,

  created_at NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP
) WITHOUT ROWID;

--CREATE TABLE constraints (
--  template_id INTEGER NOT NULL,
--  property_id TEXT NOT NULL COLLATE NOCASE,
--  type_name TEXT NOT NULL 
--  definition,
--
--  PRIMARY KEY (id, predicate_name, type_name),
--  FOREIGN KEY (id) REFERENCES templates(id)
--    ON DELETE CASCADE,
--  FOREIGN KEY (predicate_name, type_name) REFERENCES predicates(predicate_name, type_name)
--    ON DELETE CASCADE
--);

