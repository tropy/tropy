CREATE TABLE vocabularies (
  vocabulary_uri  TEXT     NOT NULL PRIMARY KEY,
  created         NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  prefix          TEXT,
  description     TEXT,

  CHECK (vocabulary_uri != ''),
  CHECK (prefix != ''),
  UNIQUE (prefix)
);

CREATE TABLE properties (
  property_uri    TEXT NOT NULL PRIMARY KEY,
  vocabulary_uri  TEXT NOT NULL REFERENCES vocabularies ON DELETE CASCADE,
  domain          TEXT REFERENCES classes (class_uri),
  range           TEXT REFERENCES classes (class_uri),
  parent          TEXT REFERENCES properties (property_uri),
  definition      TEXT,
  comment         TEXT,

  CHECK (property_uri != ''),
  CHECK (parent != ''),
  CHECK (domain != ''),
  CHECK (range != '')
);

CREATE TABLE classes (
  class_uri       TEXT NOT NULL PRIMARY KEY,
  vocabulary_uri  TEXT NOT NULL REFERENCES vocabularies ON DELETE CASCADE,
  definition      TEXT,
  comment         TEXT,
  parent          TEXT REFERENCES classes (class_uri),

  CHECK (class_uri != ''),
  CHECK (parent != '')
);

CREATE TABLE labels (
  uri       TEXT NOT NULL,
  language  TEXT NOT NULL COLLATE NOCASE,
  label     TEXT NOT NULL,

  PRIMARY KEY (uri, language),
  CHECK (uri != ''),
  CHECK (language != '' AND language = trim(lower(language))),
  CHECK (label != '')
) WITHOUT ROWID;
