CREATE TABLE metadata (
  id INTEGER NOT NULL,
  property_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  value,
  language_code TEXT COLLATE NOCASE,

  PRIMARY KEY(id, property_id),
  UNIQUE(id, position),

  FOREIGN KEY(id) REFERENCES subjects(id)
    ON DELETE CASCADE,
  FOREIGN KEY(property_id) REFERENCES properties(property_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY (language_code) REFERENCES languages(language_code)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) WITHOUT ROWID;

CREATE TABLE properties (
  property_id TEXT NOT NULL PRIMARY KEY,
  property_name TEXT NOT NULL COLLATE NOCASE,
  type_id TEXT NOT NULL,

  FOREIGN KEY(type_id) REFERENCES types(type_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) WITHOUT ROWID;

CREATE TABLE types (
  type_id TEXT NOT NULL PRIMARY KEY,
  type_name TEXT NOT NULL COLLATE NOCASE
) WITHOUT ROWID;

INSERT INTO types (type_id, type_name) VALUES
  ('https://schema.org/Text', 'Text'),
  ('https://schema.org/DateTime', 'DateTime'),
  ('https://schema.org/Boolean', 'Boolean'),
  ('https://schema.org/Number', 'Number');



CREATE TABLE templates (
  template_id TEXT NOT NULL PRIMARY KEY,
  template_name TEXT NOT NULL COLLATE NOCASE,

  created_at NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP
) WITHOUT ROWID;

--CREATE TABLE constraints (
--  template_id INTEGER NOT NULL,
--  property_id TEXT NOT NULL COLLATE NOCASE,
--  type_name TEXT NOT NULL COLLATE NOCASE,
--  definition,
--
--  PRIMARY KEY (id, predicate_name, type_name),
--  FOREIGN KEY (id) REFERENCES templates(id)
--    ON DELETE CASCADE,
--  FOREIGN KEY (predicate_name, type_name) REFERENCES predicates(predicate_name, type_name)
--    ON DELETE CASCADE
--);

CREATE TABLE languages (
  language_code TEXT NOT NULL COLLATE NOCASE PRIMARY KEY
) WITHOUT ROWID;

INSERT INTO languages (language_code) VALUES ('en');
