CREATE TABLE new_taggings (
  tag_id     INTEGER  NOT NULL REFERENCES tags ON DELETE CASCADE,
  id         INTEGER  NOT NULL REFERENCES subjects ON DELETE CASCADE,
  created    NUMERIC  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, tag_id)
) WITHOUT ROWID;

INSERT INTO new_taggings
  SELECT tag_id, id, datetime('now') AS created FROM taggings;

DROP TABLE taggings;

ALTER TABLE new_taggings RENAME TO taggings;
