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

-- Add metadata
UPDATE metadata
  SET value_id = 1, language = 'en'
  WHERE id = 1 AND property = 'title';
INSERT INTO metadata (id, property, value_id, language)
  SELECT 1, 'title', 1, 'en' WHERE changes() = 0;

UPDATE metadata
  SET value_id = 3
  WHERE id = 1 AND property = 'date';
INSERT INTO metadata (id, property, value_id)
  SELECT 1, 'date', 3 WHERE changes() = 0;

UPDATE metadata
  SET value_id = 1
  WHERE id = 2 AND property = 'title';
INSERT INTO metadata (id, property, value_id)
  SELECT 2, 'title', 1 WHERE changes() = 0;

UPDATE metadata
  SET value_id = 4
  WHERE id = 2 AND property = 'date';
INSERT INTO metadata (id, property, value_id)
  SELECT 2, 'date', 4 WHERE changes() = 0;

UPDATE metadata
  SET value_id = 2
  WHERE id = 3 AND property = 'title';
INSERT INTO metadata (id, property, value_id)
  SELECT 3, 'title', 2 WHERE changes() = 0;

UPDATE metadata
  SET value_id = 4
  WHERE id = 4 AND property = 'date';
INSERT INTO metadata (id, property, value_id)
  SELECT 4, 'date', 4 WHERE changes() = 0;

-- Overwrite a property
UPDATE metadata
  SET value_id = 2
  WHERE id = 2 AND property = 'title';
INSERT INTO metadata (id, property, value_id)
  SELECT 2, 'title', 2 WHERE changes() = 0;

-- Dangling values
SELECT v.value_id AS dangling_value
  FROM metadata_values v LEFT OUTER JOIN metadata m USING (value_id)
  WHERE m.value_id IS NULL;

-- Soft-delete item
--INSERT INTO trash (id) VALUES (2);
-- Deleted items
--SELECT id AS id, deleted FROM trash JOIN items USING (id);

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
  ORDER BY id, created ASC;

-- Query by first/last name
-- Query using time functions
-- Query using indices
-- Full-text search
