
CREATE TABLE archive (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  opened_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE items (
  id INTEGER PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  modified_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE photos (
  id INTEGER PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id),
  path TEXT NOT NULL,
  mimetype TEXT,
  checksum TEXT,
  exif JSON,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  modified_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE selections (
  id INTEGER PRIMARY KEY,
  photo_id INTEGER NOT NULL REFERENCES photos(id),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  modified_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE notes (
  id INTEGER PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  modified_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE lists (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id INTEGER REFERENCES lists(id),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  modified_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE list_items (
  item_id INTEGER REFERENCES items(id),
  list_id INTEGER REFERENCES lists(id),
  position INTEGER NOT NULL DEFAULT 0,

  PRIMARY KEY(item_id, list_id)
);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL COLLATE NOCASE,
  color INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  modified_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE item_tags (
  item_id INTEGER REFERENCES items(id),
  tag_id INTEGER REFERENCES tags(id),

  PRIMARY KEY(item_id, tag_id)
);

CREATE TABLE deleted_items (
  item_id INTEGER NOT NULL REFERENCES items(id),
  deleted_at TIMESTAMP NOT NULL DEFAULT current_timestamp,

  PRIMARY KEY(item_id, deleted_at)
);
