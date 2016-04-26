-- Archive metadata and settings which must be bound
-- to the database file.
CREATE TABLE archive (
  archive_id  TEXT     NOT NULL PRIMARY KEY,
  name        TEXT     NOT NULL,
  settings             NOT NULL DEFAULT '{}',
  created_at  NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  opened_at   NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CHECK (archive_id != ''),
  CHECK (name != '')
) WITHOUT ROWID;


-- Metatable for items, photos, and selections.
-- A field `sid` in the database always references
-- a row in the subjects table.
CREATE TABLE subjects (
  sid         INTEGER  PRIMARY KEY,
  created_at  NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP
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


CREATE TABLE metadata (
  metadata_id  INTEGER  PRIMARY KEY,
  sid          INTEGER  NOT NULL REFERENCES subjects ON DELETE CASCADE,
  property_id  TEXT     NOT NULL REFERENCES properties,
  value_id     INTEGER  NOT NULL REFERENCES metadata_values,
  position     INTEGER  NOT NULL DEFAULT 0,

  UNIQUE (sid, position)
);

CREATE TABLE metadata_values (
  value_id  INTEGER  NOT NULL PRIMARY KEY,
  value              NOT NULL,
  language  TEXT     REFERENCES languages,

  UNIQUE (value, language)
);


CREATE TABLE notes (
  note_id     INTEGER  PRIMARY KEY,
  sid         INTEGER  NOT NULL REFERENCES subjects ON DELETE CASCADE,
  position    INTEGER  NOT NULL DEFAULT 0,
  text        TEXT     NOT NULL,
  language    TEXT     NOT NULL DEFAULT 'en' REFERENCES languages,
  created_at  NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
