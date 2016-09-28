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
--INSERT OR IGNORE
--  INTO lists (parent_list_id, name, position) VALUES (0, "otto", 3);

UPDATE OR IGNORE lists
  SET parent_list_id = list_id WHERE list_id = 3;

-- Cycles (raises abort!)
--UPDATE lists SET parent_list_id = 1 WHERE list_id = 0;


-- Soft-delete
UPDATE lists SET parent_list_id = NULL WHERE list_id = 4;

SELECT list_id AS deleted_list_id
  FROM lists
  WHERE parent_list_id IS NULL AND list_id <> 0;

-- Re-order
UPDATE lists
  SET position =
    CASE list_id
    WHEN 1 THEN 2
    WHEN 2 THEN 3
    WHEN 3 THEN 4
    WHEN 5 THEN 1
    END
  WHERE parent_list_id = 0;
UPDATE lists
  SET position =
    CASE list_id
    WHEN 6 THEN 2
    WHEN 7 THEN 1
    END
  WHERE parent_list_id = 1;

-- Ancestors
WITH RECURSIVE
  ancestors(id) AS (
    SELECT parent_list_id FROM lists WHERE list_id = 6
    UNION
    SELECT parent_list_id
      FROM lists, ancestors
      WHERE lists.list_id = ancestors.id
  )
  SELECT json_group_array(id) AS ancestors FROM ancestors;


-- Node with child ids (JSON, unordered)
SELECT l1.list_id, json_group_array(l2.list_id) AS children
  FROM lists l1 LEFT OUTER JOIN lists l2 ON l2.parent_list_id = l1.list_id
  WHERE l1.list_id = 0
  GROUP BY l1.list_id;

-- Node with child ids (concat with position)
SELECT l1.list_id, group_concat(l2.list_id || ':' || l2.position) AS children
  FROM lists l1 LEFT OUTER JOIN lists l2 ON l2.parent_list_id = l1.list_id
  WHERE l1.list_id = 0
  GROUP BY l1.list_id;

-- Node with child ids (JSON, ordered via sub-query)
WITH
  children(list_id) AS (
    SELECT list_id FROM lists WHERE parent_list_id = 0 ORDER BY position ASC
  )
  SELECT l.list_id, json_group_array(c.list_id) AS children
    FROM lists l, children c
    WHERE l.list_id = 0
    GROUP BY l.list_id;

-- Sub-tree with child ids (unordered)
SELECT l1.list_id, l1.name, json_group_array(l2.list_id) AS children
  FROM lists l1 LEFT OUTER JOIN lists l2 ON l2.parent_list_id = l1.list_id
  WHERE l1.parent_list_id = 0
  GROUP BY l1.list_id
  ORDER BY l1.position ASC;

-- Sub-tree with child ids (unordered, with position)
SELECT l1.list_id, l1.name,
  json_group_array(json_array(l2.position, l2.list_id)) AS children
  FROM lists l1 LEFT OUTER JOIN lists l2 ON l2.parent_list_id = l1.list_id
  WHERE l1.parent_list_id = 0
  GROUP BY l1.list_id
  ORDER BY l1.position ASC;

-- Sub-tree with child ids (unordered, with position)
SELECT l1.list_id, l1.name,
  group_concat(l2.position || ':' || l2.list_id) AS children
  FROM lists l1 LEFT OUTER JOIN lists l2 ON l2.parent_list_id = l1.list_id
  WHERE l1.parent_list_id = 0
  GROUP BY l1.list_id
  ORDER BY l1.position ASC;

-- Sub-tree with child ids (ordered, via sub-query)
--WITH
--  children(list_id, parent_list_id) AS (
--    SELECT list_id, parent_list_id
--      FROM lists
--      ORDER BY parent_list_id, position ASC
--  )
--  SELECT p.list_id, p.name, json_group_array(c.list_id) AS children
--    FROM lists p LEFT OUTER JOIN children c ON c.parent_list_id = p.list_id
--    WHERE p.parent_list_id = 0
--    GROUP BY p.list_id
--    ORDER BY p.position ASC;
