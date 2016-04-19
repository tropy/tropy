
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
