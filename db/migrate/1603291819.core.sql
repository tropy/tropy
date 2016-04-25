-- Archive metadata and settings which must be bound
-- to the database file.
CREATE TABLE archive (
  archive_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  settings TEXT NOT NULL,
  created_at NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP,
  opened_at NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP
) WITHOUT ROWID;


-- Metatable for items, photos, and selections.
-- A field `id` in the database always references
-- a row in the subjects table.
CREATE TABLE subjects (
  id INTEGER PRIMARY KEY,
  created_at NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- Metatable for photos and selections.
CREATE TABLE images (
  id INTEGER PRIMARY KEY,
  width INTEGER NOT NULL DEFAULT 0,
  height INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(id) REFERENCES subjects(id)
    ON DELETE CASCADE
) WITHOUT ROWID;


CREATE TABLE items (
  id INTEGER PRIMARY KEY,
  cover_image_id INTEGER,

  FOREIGN KEY(id) REFERENCES subjects(id)
    ON DELETE CASCADE,
  FOREIGN KEY (cover_image_id) REFERENCES images(id)
    ON DELETE SET NULL
) WITHOUT ROWID;


-- Notes
CREATE TABLE notes (
  note_id INTEGER PRIMARY KEY,
  text TEXT NOT NULL,
  created_at NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subject_notes (
  id INTEGER,
  note_id INTEGER,
  position INTEGER NOT NULL DEFAULT 0,

  PRIMARY KEY(id, note_id),
  UNIQUE(id, note_id, position),

  FOREIGN KEY(id) REFERENCES subjects(id)
    ON DELETE CASCADE,
  FOREIGN KEY(note_id) REFERENCES notes(note_id)
    ON DELETE CASCADE
) WITHOUT ROWID;


-- Lists
CREATE TABLE lists (
  list_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  parent_list_id INTEGER,
  created_at NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY(parent_list_id) REFERENCES lists(list_id)
    ON DELETE CASCADE
);

CREATE TABLE list_items (
  id INTEGER,
  list_id INTEGER,
  position INTEGER NOT NULL DEFAULT 0,

  PRIMARY KEY(id, list_id),
  UNIQUE(id, list_id, position),

  FOREIGN KEY(id) REFERENCES items(id)
    ON DELETE CASCADE,
  FOREIGN KEY(list_id) REFERENCES lists(list_id)
    ON DELETE CASCADE
) WITHOUT ROWID;


-- Tags
CREATE TABLE tags (
  tag_name TEXT PRIMARY KEY COLLATE NOCASE,
  tag_color,
  created_at NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CHECK (tag_name <> '')
);

CREATE TABLE subject_tags (
  id INTEGER,
  tag_name TEXT,
  tagged_at NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY(id, tag_name),

  FOREIGN KEY(id) REFERENCES subjects(id)
    ON DELETE CASCADE,
  FOREIGN KEY(tag_name) REFERENCES tags(tag_name)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) WITHOUT ROWID;


CREATE TABLE trash (
  id INTEGER PRIMARY KEY,
  deleted_at NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (id) REFERENCES subjects(id)
    ON DELETE CASCADE
) WITHOUT ROWID;
