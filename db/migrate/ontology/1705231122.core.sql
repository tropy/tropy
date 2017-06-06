CREATE TABLE vocabularies (
  vocabulary_id   TEXT     NOT NULL PRIMARY KEY,
  prefix          TEXT,
  created         NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted         NUMERIC,

  title           TEXT,
  description     TEXT,
  comment         TEXT,
  see_also        TEXT,

  CHECK (vocabulary_id != '' AND prefix != ''),
  UNIQUE (prefix)
);

CREATE TABLE properties (
  property_id     TEXT NOT NULL PRIMARY KEY,
  vocabulary_id   TEXT NOT NULL REFERENCES vocabularies ON DELETE CASCADE,
  domain          TEXT,
  range           TEXT,
  parent          TEXT,

  description     TEXT,
  comment         TEXT,

  CHECK (property_id != '')
);

CREATE TABLE classes (
  class_id        TEXT NOT NULL PRIMARY KEY,
  vocabulary_id   TEXT NOT NULL REFERENCES vocabularies ON DELETE CASCADE,
  parent          TEXT,

  description     TEXT,
  comment         TEXT,

  CHECK (class_id != '')
);

CREATE TABLE labels (
  id        TEXT NOT NULL,
  language  TEXT NOT NULL COLLATE NOCASE,
  label     TEXT NOT NULL,

  PRIMARY KEY (id, language),

  CHECK (id != '' AND label != ''),
  CHECK (language != '' AND language = trim(lower(language)))
) WITHOUT ROWID;
