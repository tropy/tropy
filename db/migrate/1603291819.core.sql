-- Project metadata and settings which must be bound
-- to the database file.
CREATE TABLE project (
  project_id  TEXT     NOT NULL PRIMARY KEY,
  name        TEXT     NOT NULL,
  settings             NOT NULL DEFAULT '{}',
  created_at  NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  opened_at   NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CHECK (project_id != ''),
  CHECK (name != '')
) WITHOUT ROWID;


-- Metatable for items, photos, and selections.
-- A field `sid` in the database always references
-- a row in the subjects table.
CREATE TABLE subjects (
  sid          INTEGER  PRIMARY KEY,
  template_id  TEXT,
  created_at   NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- Metatable for photos and selections.
CREATE TABLE images (
  sid     INTEGER  PRIMARY KEY REFERENCES subjects ON DELETE CASCADE,
  width   INTEGER  NOT NULL DEFAULT 0,
  height  INTEGER  NOT NULL DEFAULT 0
) WITHOUT ROWID;


CREATE TABLE items (
  sid             INTEGER  PRIMARY KEY REFERENCES subjects ON DELETE CASCADE,
  cover_image_id  INTEGER  REFERENCES images ON DELETE SET NULL
) WITHOUT ROWID;


CREATE TABLE metadata_types (
  type_name    TEXT  NOT NULL PRIMARY KEY COLLATE NOCASE,
  type_schema  TEXT  NOT NULL UNIQUE,

  CHECK (type_schema != ''),
  CHECK (type_name != '')
) WITHOUT ROWID;

INSERT INTO metadata_types (type_name, type_schema) VALUES
  ('text', 'https://schema.org/Text'),
  ('datetime', 'https://schema.tropy.org/types/datetime'),
  ('name', 'https://schema.tropy.org/types/name'),
  ('boolean', 'https://schema.org/Boolean'),
  ('number', 'https://schema.org/Number'),
  ('location', 'https://schema.org/GeoCoordinates');


CREATE TABLE metadata (
  metadata_id  INTEGER  PRIMARY KEY,
  sid          INTEGER  NOT NULL REFERENCES subjects ON DELETE CASCADE,
  property_id  TEXT     NOT NULL,
  value_id     INTEGER  NOT NULL REFERENCES metadata_values,
  position     INTEGER  NOT NULL DEFAULT 0,

  UNIQUE (sid, position)
);

CREATE TABLE metadata_values (
  value_id  INTEGER  NOT NULL PRIMARY KEY,
  type_name TEXT     NOT NULL REFERENCES metadata_types
                       ON DELETE CASCADE ON UPDATE CASCADE,
  value              NOT NULL,
  struct             NOT NULL DEFAULT '{}',
  language  TEXT     REFERENCES languages,

  UNIQUE (type_name, value, language)
);


CREATE TABLE notes (
  note_id      INTEGER  PRIMARY KEY,
  sid          INTEGER  NOT NULL REFERENCES subjects ON DELETE CASCADE,
  position     INTEGER  NOT NULL DEFAULT 0,
  text         TEXT     NOT NULL,
  language     TEXT     NOT NULL DEFAULT 'en' REFERENCES languages,
  created_at   NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (sid, position)
);


CREATE TABLE lists (
  list_id         INTEGER  PRIMARY KEY,
  name            TEXT     NOT NULL,
  parent_list_id  INTEGER  REFERENCES lists,
  created_at      NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE list_items (
  sid      INTEGER REFERENCES items ON DELETE CASCADE,
  list_id  INTEGER REFERENCES lists ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,

  PRIMARY KEY (sid, list_id),
  UNIQUE (sid, list_id, position)
) WITHOUT ROWID;


CREATE TABLE tags (
  tag_name    TEXT     NOT NULL PRIMARY KEY COLLATE NOCASE,
  tag_color,
  created_at  NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CHECK (tag_name <> '')
) WITHOUT ROWID;

CREATE TABLE taggings (
  sid        INTEGER  NOT NULL REFERENCES subjects ON DELETE CASCADE,
  tag_name   TEXT     NOT NULL COLLATE NOCASE
                      REFERENCES tags ON DELETE CASCADE ON UPDATE CASCADE,
  tagged_at  NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (sid, tag_name)
) WITHOUT ROWID;


CREATE TABLE trash (
  sid         INTEGER  PRIMARY KEY REFERENCES subjects ON DELETE CASCADE,
  deleted_at  NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP
) WITHOUT ROWID;
