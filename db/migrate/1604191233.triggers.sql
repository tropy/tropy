
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


CREATE TRIGGER insert_lists_set_position
  AFTER INSERT ON lists
  FOR EACH ROW WHEN NEW.position = 0
  BEGIN
    UPDATE lists SET name = trim(name),
      position = 1 + coalesce(
        (
          SELECT max(position)
          FROM lists
          WHERE parent_list_id = NEW.parent_list_id
        ),
        0
      )
      WHERE list_id = NEW.list_id;
  END;
