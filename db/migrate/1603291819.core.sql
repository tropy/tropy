-- Archive metadata and settings which must be bound
-- to the database file.
CREATE TABLE archive (
  archive_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  settings TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT current_timestamp,
  opened_at DATETIME NOT NULL DEFAULT current_timestamp
) WITHOUT ROWID;


-- Metatable for items, photos, and selections.
-- A field `id` in the database always references
-- a row in the objects table.
CREATE TABLE objects (
  id INTEGER PRIMARY KEY,
  created_at DATETIME NOT NULL DEFAULT current_timestamp,
  updated_at DATETIME NOT NULL DEFAULT current_timestamp
);


-- Metatable for photos and selections.
CREATE TABLE images (
  id INTEGER PRIMARY KEY,
  width INTEGER NOT NULL DEFAULT 0,
  height INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(id) REFERENCES objects(id)
    ON DELETE CASCADE
) WITHOUT ROWID;


CREATE TABLE items (
  id INTEGER PRIMARY KEY,
  cover_image_id INTEGER,

  FOREIGN KEY(id) REFERENCES objects(id)
    ON DELETE CASCADE,
  FOREIGN KEY (cover_image_id) REFERENCES images(id)
    ON DELETE SET NULL
) WITHOUT ROWID;


-- Notes
CREATE TABLE notes (
  note_id INTEGER PRIMARY KEY,
  text TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT current_timestamp,
  updated_at DATETIME NOT NULL DEFAULT current_timestamp
);

CREATE TABLE object_notes (
  id INTEGER,
  note_id INTEGER,
  position INTEGER NOT NULL DEFAULT 0,

  PRIMARY KEY(id, note_id),
  UNIQUE(id, note_id, position),

  FOREIGN KEY(id) REFERENCES objects(id)
    ON DELETE CASCADE,
  FOREIGN KEY(note_id) REFERENCES notes(note_id)
    ON DELETE CASCADE
) WITHOUT ROWID;


-- Lists
CREATE TABLE lists (
  list_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  parent_list_id INTEGER,
  created_at DATETIME NOT NULL DEFAULT current_timestamp,
  updated_at DATETIME NOT NULL DEFAULT current_timestamp,

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
  tag_id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL COLLATE NOCASE,
  color,
  created_at DATETIME NOT NULL DEFAULT current_timestamp,
  updated_at DATETIME NOT NULL DEFAULT current_timestamp
);

CREATE TABLE object_tags (
  id INTEGER,
  tag_id INTEGER,
  tagged_at DATETIME NOT NULL DEFAULT current_timestamp,

  PRIMARY KEY(id, tag_id),

  FOREIGN KEY(id) REFERENCES objects(id)
    ON DELETE CASCADE,
  FOREIGN KEY(tag_id) REFERENCES tags(tag_id)
    ON DELETE CASCADE
) WITHOUT ROWID;


CREATE TABLE trash (
  id INTEGER PRIMARY KEY,
  deleted_at DATETIME NOT NULL DEFAULT current_timestamp,

  FOREIGN KEY (id) REFERENCES objects(id)
    ON DELETE CASCADE
) WITHOUT ROWID;
