PRAGMA foreign_keys = on;

-- Create empty items
INSERT INTO subjects DEFAULT VALUES;
INSERT INTO items (id) VALUES (last_insert_rowid());

INSERT INTO subjects DEFAULT VALUES;
INSERT INTO items (id) VALUES (last_insert_rowid());

INSERT INTO subjects DEFAULT VALUES;
INSERT INTO items (id) VALUES (last_insert_rowid());

INSERT INTO subjects DEFAULT VALUES;
INSERT INTO items (id) VALUES (last_insert_rowid());


-- Add values
INSERT INTO metadata_values (type_name, value)
  VALUES ('text', 'Foo');
INSERT INTO metadata_values (type_name, value)
  VALUES ('text', 'Bar');
INSERT INTO metadata_values (type_name, value)
  VALUES ('date', '2016');
INSERT INTO metadata_values (type_name, value)
  VALUES ('date', '2017');
INSERT INTO metadata_values (type_name, value)
  VALUES ('date', '2018');

REPLACE INTO metadata (id, property, value_id, language)
  VALUES (1, 'title', 1, 'en');
REPLACE INTO metadata (id, property, value_id)
  VALUES (1, 'date', 3);

REPLACE INTO metadata (id, property, value_id)
  VALUES (2, 'title', 1);
REPLACE INTO metadata (id, property, value_id)
  VALUES (2, 'date', 4);

REPLACE INTO metadata (id, property, value_id)
  VALUES (3, 'title', 2);

REPLACE INTO metadata (id, property, value_id)
  VALUES (4, 'date', 4);

-- Overwrite a property
REPLACE INTO metadata (id, property, value_id)
  VALUES (2, 'title', 2);

-- Dangling values
SELECT v.value_id AS dangling_value
  FROM metadata_values v LEFT OUTER JOIN metadata m USING (value_id)
  WHERE m.value_id IS NULL;

-- Soft-delete item
--INSERT INTO trash (id) VALUES (2);
-- Deleted items
--SELECT id AS id, deleted_at FROM trash JOIN items USING (id);

-- All items sorted by title
WITH
  titles(id, value) AS (
    SELECT id, value AS title
    FROM metadata JOIN metadata_values USING (value_id)
    WHERE property = 'title'
  )
  SELECT id, t.value
    FROM items
      LEFT OUTER JOIN titles t USING (id)
      LEFT OUTER JOIN trash d USING (id)
    WHERE d.id IS NULL
    ORDER BY t.value ASC, id ASC;

-- Metadata for specific items
SELECT id, property AS property, value, type_name
  FROM items
    JOIN metadata USING (id)
    JOIN metadata_values USING (value_id)
  WHERE id in (1, 2, 3, 4)
  ORDER BY id, created_at ASC;

-- Query by first/last name
-- Query using time functions
-- Query using indices
-- Full-text search
