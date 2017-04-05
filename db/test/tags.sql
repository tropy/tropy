PRAGMA foreign_keys = on;

INSERT INTO tags (tag_id, name) VALUES
  (1, "rosso"),
  (2, " azzurro"),
  (3, "blu "),
  (4, "viola"),
  (NULL, "bianco"),
  (NULL, "nero"),
  (7, "marrone");


-- Constraints
INSERT OR IGNORE
  INTO tags (name) VALUES ("blu");
INSERT OR IGNORE
  INTO tags (name) VALUES ("");
UPDATE OR IGNORE tags
  SET name = "" WHERE tag_id = 3;

-- All tags
SELECT tag_id, name, color FROM tags;
