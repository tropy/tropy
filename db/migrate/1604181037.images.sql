
CREATE TABLE photos (
  id           INTEGER  PRIMARY KEY REFERENCES images ON DELETE CASCADE,
  item_id      INTEGER  REFERENCES items ON DELETE CASCADE,
  position     INTEGER,
  path         TEXT     NOT NULL,
  protocol     TEXT     NOT NULL DEFAULT 'file',
  mimetype     TEXT     NOT NULL,
  checksum     TEXT     NOT NULL,
  orientation  INTEGER  NOT NULL DEFAULT 1,
  exif                  NOT NULL DEFAULT '{}'
) WITHOUT ROWID;


CREATE TABLE selections (
  id        INTEGER  PRIMARY KEY REFERENCES images ON DELETE CASCADE,
  photo_id  INTEGER  NOT NULL REFERENCES photos ON DELETE CASCADE,
  quality   TEXT     NOT NULL DEFAULT 'default' REFERENCES image_qualities,
  x         NUMERIC  NOT NULL DEFAULT 0,
  y         NUMERIC  NOT NULL DEFAULT 0,
  pct       BOOLEAN  NOT NULL DEFAULT 0
) WITHOUT ROWID;


CREATE TABLE image_scales (
  id      INTEGER  PRIMARY KEY REFERENCES selections ON DELETE CASCADE,
  x       NUMERIC  NOT NULL DEFAULT 0,
  y       NUMERIC  NOT NULL DEFAULT 0,
  factor  NUMERIC  NOT NULL,
  fit     BOOLEAN  NOT NULL DEFAULT 0
) WITHOUT ROWID;

CREATE TABLE image_rotations (
  id      INTEGER  PRIMARY KEY REFERENCES selections ON DELETE CASCADE,
  angle   NUMERIC  NOT NULL DEFAULT 0,
  mirror  BOOLEAN  NOT NULL DEFAULT 0
) WITHOUT ROWID;


CREATE TABLE image_qualities (
  quality  TEXT  NOT NULL PRIMARY KEY
) WITHOUT ROWID;

INSERT INTO image_qualities (quality) VALUES
  ('default'), ('color'), ('gray'), ('bitonal');
