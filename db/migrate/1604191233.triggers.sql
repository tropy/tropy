
CREATE TRIGGER insert_tags
  AFTER INSERT ON tags
  BEGIN
    UPDATE tags SET tag_name = trim(tag_name)
      WHERE tag_name = NEW.tag_name;
  END;

CREATE TRIGGER update_tags
  AFTER UPDATE ON tags
  BEGIN
    UPDATE tags SET tag_name = trim(tag_name)
      WHERE tag_name = NEW.tag_name;
  END;



-- List Triggers
-- -------------

CREATE TRIGGER insert_lists_trim_name
  AFTER INSERT ON lists
  BEGIN
    UPDATE lists SET name = trim(name)
      WHERE list_id = NEW.list_id;
  END;

CREATE TRIGGER update_lists_trim_name
  AFTER UPDATE ON lists
  BEGIN
    UPDATE lists SET name = trim(name)
      WHERE list_id = NEW.list_id;
  END;

CREATE TRIGGER update_lists_cycle_check
  BEFORE UPDATE ON lists
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

