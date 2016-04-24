CREATE TABLE metadata (
  id INTEGER,
  field_name TEXT,
  type_name TEXT,
  position INTEGER NOT NULL DEFAULT 0,

  value,

  PRIMARY KEY(id, field_name, type_name),
  UNIQUE(id, position),

  FOREIGN KEY(id) REFERENCES subjects(id)
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
  id INTEGER PRIMARY KEY,
  template_name TEXT UNIQUE NOT NULL COLLATE NOCASE,

  FOREIGN KEY (id) REFERENCES items(id)
    ON DELETE CASCADE
) WITHOUT ROWID;

CREATE TABLE constraints (
  id INTEGER NOT NULL,
  field_name TEXT NOT NULL COLLATE NOCASE,
  type_name TEXT NOT NULL COLLATE NOCASE,
  definition,

  PRIMARY KEY (id, field_name, type_name),
  FOREIGN KEY (id) REFERENCES templates(id)
    ON DELETE CASCADE,
  FOREIGN KEY (field_name, type_name) REFERENCES fields(field_name, type_name)
    ON DELETE CASCADE
);
