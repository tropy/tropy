--
-- This file is auto-generated from the current state of
-- the database. Instead of editing this file, please
-- create migratios to incrementally modify the database,
-- and then regenerate this schema file.
--

-- Save current migration number
PRAGMA user_version=1603291819;

-- SQLite schema dump
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE archive (
  archive_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  opened_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);
CREATE TABLE items (
  item_id INTEGER PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  modified_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);
CREATE TABLE photos (
  photo_id INTEGER PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(item_id),
  path TEXT NOT NULL,
  mimetype TEXT,
  checksum TEXT,
  exif JSON,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  modified_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);
CREATE TABLE selections (
  selection_id INTEGER PRIMARY KEY,
  photo_id INTEGER NOT NULL REFERENCES photos(photo_id),
  position INTEGER NOT NULL DEFAULT 0,
  top INTEGER NOT NULL DEFAULT 0,
  left INTEGER NOT NULL DEFAULT 0,
  bottom INTEGER NOT NULL DEFAULT 0,
  right INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  modified_at TIMESTAMP NOT NULL DEFAULT current_timestamp,

  UNIQUE(photo_id, position)
);
CREATE TABLE notes (
  note_id INTEGER PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  modified_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);
CREATE TABLE lists (
  list_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  parent_list_id INTEGER REFERENCES lists(list_id),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  modified_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);
CREATE TABLE list_items (
  item_id INTEGER REFERENCES items(item_id),
  list_id INTEGER REFERENCES lists(list_id),
  position INTEGER NOT NULL DEFAULT 0,

  PRIMARY KEY(item_id, list_id),
  UNIQUE(item_id, list_id, position)
);
CREATE TABLE tags (
  tag_id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL COLLATE NOCASE,
  color INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  modified_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);
CREATE TABLE item_tags (
  item_id INTEGER REFERENCES items(item_id),
  tag_id INTEGER REFERENCES tags(tag_id),

  PRIMARY KEY(item_id, tag_id)
);
CREATE TABLE deleted_items (
  item_id INTEGER PRIMARY KEY REFERENCES items(item_id),
  deleted_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);
COMMIT;
PRAGMA foreign_keys=ON;