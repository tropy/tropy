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

REPLACE INTO metadata (id, property, value_id, position)
  VALUES (1, 'title', 1, 1);
REPLACE INTO metadata (id, property, value_id, position)
  VALUES (1, 'date', 3, 2);

REPLACE INTO metadata (id, property, value_id, position)
  VALUES (2, 'title', 2, 1);
REPLACE INTO metadata (id, property, value_id, position)
  VALUES (2, 'date', 4, 2);

REPLACE INTO metadata (id, property, value_id, position)
  VALUES (3, 'title', 2, 1);

REPLACE INTO metadata (id, property, value_id, position)
  VALUES (4, 'date', 4, 1);

-- Soft-delete item
--INSERT INTO trash (id) VALUES (3);

-- All items sorted by title
WITH
  titles(id, title) AS (
    SELECT id, value AS title
    FROM metadata JOIN metadata_values USING (value_id)
    WHERE property= 'title'
  )
  SELECT id, title
    FROM items LEFT OUTER JOIN titles USING (id)
    WHERE id NOT IN (SELECT id FROM trash)
    ORDER BY title ASC, id ASC;

-- Metadata for specific items
SELECT id, property AS property, value, type_name
  FROM items
    JOIN metadata USING (id)
    JOIN metadata_values USING (value_id)
  WHERE id in (1, 2, 3, 4)
  ORDER BY id, position ASC;

-- Deleted items
--SELECT id AS id, deleted_at FROM trash JOIN items USING (id);

-- Query by first/last name
-- Query using time functions
-- Query using indices
-- Full-text search
