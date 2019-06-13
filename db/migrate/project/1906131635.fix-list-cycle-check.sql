DROP TRIGGER IF EXISTS update_lists_cycle_check;

CREATE TRIGGER update_lists_cycle_check
  BEFORE UPDATE OF parent_list_id ON lists
  FOR EACH ROW WHEN NEW.parent_list_id NOT NULL
  BEGIN
    SELECT CASE (
        WITH RECURSIVE
          ancestors(id) AS (
            SELECT parent_list_id
              FROM lists
              WHERE list_id = NEW.parent_list_id
            UNION
            SELECT parent_list_id
              FROM lists, ancestors
              WHERE lists.list_id = ancestors.id
          )
          SELECT count(*) FROM ancestors WHERE id = OLD.list_id
      )
      WHEN 1 THEN
        RAISE(ABORT, 'Lists may not contain cycles')
      END;
  END;
