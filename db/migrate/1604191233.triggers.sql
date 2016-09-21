
CREATE TRIGGER insert_tags
  AFTER INSERT ON tags
  BEGIN
    UPDATE tags
      SET tag_name = trim(tag_name)
      WHERE tag_name = NEW.tag_name;
  END;

CREATE TRIGGER update_tags
  AFTER UPDATE ON tags
  BEGIN
    UPDATE tags
      SET tag_name = trim(tag_name)
      WHERE tag_name = NEW.tag_name;
  END;


CREATE TRIGGER insert_lists
  AFTER INSERT ON lists
  BEGIN
    UPDATE lists
      SET position =
        (
          SELECT count(*) FROM lists WHERE parent_list_id = NEW.parent_list_id
        )
      WHERE list_id = NEW.list_id;
  END;
