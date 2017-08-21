-- Project metadata and settings which must be bound
-- to the database file.
CREATE TABLE project (
  project_id  TEXT     NOT NULL PRIMARY KEY,
  name        TEXT     NOT NULL,
  created     NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CHECK (project_id != ''),
  CHECK (name != '')

) WITHOUT ROWID;

CREATE TABLE access (
  uuid        TEXT     NOT NULL,
  version     TEXT     NOT NULL,
  path        TEXT     NOT NULL,
  opened      NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed      NUMERIC,
  CHECK (uuid != '' AND version != '' AND path != '')
);

-- Metatable for items, photos, and selections.
-- A field `id` in the database always references
-- a row in the subjects table.
CREATE TABLE subjects (
  id           INTEGER  PRIMARY KEY,
  template     TEXT     NOT NULL DEFAULT 'https://tropy.org/v1/templates/item',
  type         TEXT,
  created      NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified     NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- Metatable for photos and selections.
CREATE TABLE images (
  id      INTEGER  PRIMARY KEY REFERENCES subjects ON DELETE CASCADE,
  width   INTEGER  NOT NULL DEFAULT 0,
  height  INTEGER  NOT NULL DEFAULT 0,
  angle   NUMERIC  NOT NULL DEFAULT 0,
  mirror  BOOLEAN  NOT NULL DEFAULT 0,

  CHECK (angle >= 0 AND angle <= 360),
  CHECK (width >= 0 AND height >= 0)

) WITHOUT ROWID;


CREATE TABLE photos (
  id           INTEGER  PRIMARY KEY REFERENCES images ON DELETE CASCADE,
  item_id      INTEGER  NOT NULL REFERENCES items ON DELETE CASCADE,
  position     INTEGER,
  path         TEXT     NOT NULL,
  protocol     TEXT     NOT NULL DEFAULT 'file',
  mimetype     TEXT     NOT NULL,
  checksum     TEXT     NOT NULL,
  orientation  INTEGER  NOT NULL DEFAULT 1,
  metadata     TEXT     NOT NULL DEFAULT '{}',

  CHECK (orientation > 0 AND orientation < 9)
) WITHOUT ROWID;


CREATE TABLE items (
  id              INTEGER  PRIMARY KEY REFERENCES subjects ON DELETE CASCADE,
  cover_image_id  INTEGER  REFERENCES images ON DELETE SET NULL
) WITHOUT ROWID;


CREATE TABLE metadata (
  id          INTEGER  NOT NULL REFERENCES subjects ON DELETE CASCADE,
  property    TEXT     NOT NULL,
  value_id    INTEGER  NOT NULL REFERENCES metadata_values,
  language    TEXT,
  created     NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CHECK (
    language IS NULL OR language != '' AND language = trim(lower(language))
  ),

  PRIMARY KEY (id, property)
) WITHOUT ROWID;

CREATE TABLE metadata_values (
  value_id   INTEGER  PRIMARY KEY,
  datatype   TEXT     NOT NULL,
  text                NOT NULL,
  data       TEXT,

  CHECK (datatype != ''),
  UNIQUE (datatype, text)
);


CREATE TABLE notes (
  note_id      INTEGER  PRIMARY KEY,
  id           INTEGER  NOT NULL REFERENCES subjects ON DELETE CASCADE,
  text         TEXT     NOT NULL,
  state        TEXT     NOT NULL,
  language     TEXT     NOT NULL DEFAULT 'en',
  created      NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified     NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted      NUMERIC,

  CHECK (
    language != '' AND language = trim(lower(language))
  ),
  CHECK (text != '')
);


CREATE TABLE lists (
  list_id         INTEGER  PRIMARY KEY,
  name            TEXT     NOT NULL COLLATE NOCASE,
  parent_list_id  INTEGER  DEFAULT 0 REFERENCES lists ON DELETE CASCADE,
  position        INTEGER,
  created         NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified        NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CHECK (list_id != parent_list_id),
  CHECK (name != ''),

  UNIQUE (parent_list_id, name)
);

INSERT INTO lists (list_id, name, parent_list_id, created, modified)
  VALUES (0, 'ROOT', NULL, '2017-01-31 12:00:00', '2017-01-31 12:00:00');

CREATE TABLE list_items (
  list_id  INTEGER  REFERENCES lists ON DELETE CASCADE,
  id       INTEGER  REFERENCES items ON DELETE CASCADE,
  position INTEGER,
  added    NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted  NUMERIC,

  PRIMARY KEY (list_id, id)
) WITHOUT ROWID;


CREATE TABLE tags (
  tag_id      INTEGER  PRIMARY KEY,
  name        TEXT     NOT NULL COLLATE NOCASE,
  color,
  created     NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified    NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CHECK (name != ''),
  UNIQUE (name)
);

CREATE TABLE taggings (
  tag_id     INTEGER  NOT NULL REFERENCES tags ON DELETE CASCADE,
  id         INTEGER  NOT NULL REFERENCES subjects ON DELETE CASCADE,
  PRIMARY KEY (id, tag_id)
) WITHOUT ROWID;

CREATE TABLE trash (
  id          INTEGER  PRIMARY KEY REFERENCES subjects ON DELETE CASCADE,
  deleted     NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason      TEXT     NOT NULL DEFAULT 'user',

  CHECK (reason IN ('user', 'auto', 'merge'))
) WITHOUT ROWID;


