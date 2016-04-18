CREATE TABLE metadata (
  id INTEGER,
  field_name TEXT,
  type_name TEXT,
  position INTEGER NOT NULL DEFAULT 0,

  value,

  PRIMARY KEY(id, field_name, type_name),
  UNIQUE(id, position),

  FOREIGN KEY(id) REFERENCES objects(id)
    ON DELETE CASCADE,
  FOREIGN KEY(field_name, type_name) REFERENCES fields(field_name, type_name)
    ON DELETE CASCADE
  FOREIGN KEY(type_name) REFERENCES types(type_name)
    ON DELETE CASCADE
) WITHOUT ROWID;

CREATE TABLE fields (
  field_name TEXT NOT NULL COLLATE NOCASE,
  type_name TEXT NOT NULL COLLATE NOCASE,

  PRIMARY KEY(field_name, type_name),
  FOREIGN KEY(type_name) REFERENCES types(type_name)
    ON UPDATE CASCADE
) WITHOUT ROWID;

CREATE TABLE types (
  type_name TEXT PRIMARY KEY COLLATE NOCASE
) WITHOUT ROWID;

INSERT INTO types (type_name) VALUES
  ('text'), ('datetime'), ('boolean'), ('numeric'), ('name');

CREATE TABLE templates (
  template_id INTEGER PRIMARY KEY,
  template_name TEXT UNIQUE NOT NULL COLLATE NOCASE,

  created_at DATETIME NOT NULL DEFAULT current_timestamp,
  updated_at DATETIME NOT NULL DEFAULT current_timestamp
) WITHOUT ROWID;
