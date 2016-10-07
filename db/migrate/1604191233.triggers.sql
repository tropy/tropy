
-- Tag Triggers
-- ------------------------------------------------------------

CREATE TRIGGER insert_tags_trim_name
  AFTER INSERT ON tags
  BEGIN
    UPDATE tags SET name = trim(name)
      WHERE tag_id = NEW.tag_id;
  END;

CREATE TRIGGER update_tags_trim_name
  AFTER UPDATE ON tags
  FOR EACH ROW WHEN NEW.name != OLD.name
  BEGIN
    UPDATE tags SET name = trim(name)
      WHERE tag_id = NEW.tag_id;
  END;


-- List Triggers
-- ------------------------------------------------------------

CREATE TRIGGER insert_lists_trim_name
  AFTER INSERT ON lists
  BEGIN
    UPDATE lists SET name = trim(name)
      WHERE list_id = NEW.list_id;
  END;

CREATE TRIGGER update_lists_trim_name
  AFTER UPDATE ON lists
  FOR EACH ROW WHEN NEW.name != OLD.name
  BEGIN
    UPDATE lists SET name = trim(name)
      WHERE list_id = NEW.list_id;
  END;

CREATE TRIGGER update_lists_cycle_check
  BEFORE UPDATE ON lists
  FOR EACH ROW WHEN NEW.parent_list_id NOT NULL
    AND NEW.parent_list_id != OLD.parent_list_id
  BEGIN
    SELECT CASE (
        WITH RECURSIVE
          ancestors(id) AS (
            SELECT parent_list_id
              FROM lists
              WHERE list_id = OLD.list_id
            UNION
            SELECT parent_list_id
              FROM lists, ancestors
              WHERE lists.list_id = ancestors.id
          )
          SELECT count(*) FROM ancestors WHERE id = OLD.list_id LIMIT 1
      )
      WHEN 1 THEN
        RAISE(ABORT, 'Lists may not contain cycles')
      END;
  END;

