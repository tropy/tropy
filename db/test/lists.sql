PRAGMA foreign_keys = on;

INSERT INTO lists (parent_list_id, list_id, name) VALUES
  (0, 1, "uno"),
  (0, 2, " due"),
  (0, 3, "tre "),
  (0, 4, "quattro"),
  (0, NULL, "cinque"),
  (1, NULL, "sei"),
  (1, 7, "sette");


-- Constraints
INSERT OR IGNORE
  INTO lists (parent_list_id, name) VALUES (0, "uno");
INSERT OR IGNORE
  INTO lists (parent_list_id, name, position) VALUES (0, "otto", 3);

UPDATE OR IGNORE
  lists SET parent_list_id = list_id WHERE list_id = 3;

-- Cycles
UPDATE OR IGNORE
  lists SET parent_list_id = 1 WHERE list_id = 0;


-- Soft-delete
UPDATE lists SET parent_list_id = NULL WHERE list_id = 4;

SELECT list_id AS deleted_list_id
  FROM lists
  WHERE parent_list_id IS NULL AND list_id <> 0;


-- Ancestors
WITH RECURSIVE
  ancestors(id) AS (
    SELECT parent_list_id FROM lists WHERE list_id = 6
    UNION
    SELECT parent_list_id
      FROM lists, ancestors
      WHERE lists.list_id = ancestors.id
  )
  SELECT group_concat(id) AS ancestors FROM ancestors;


-- Subtree depth 1
SELECT l1.list_id, l1.name, l1.position, group_concat(l2.list_id) AS children
  FROM lists l1 LEFT OUTER JOIN lists l2 ON l2.parent_list_id = l1.list_id
  WHERE l1.parent_list_id = 0
  GROUP BY l1.list_id
  ORDER BY l1.position ASC;
