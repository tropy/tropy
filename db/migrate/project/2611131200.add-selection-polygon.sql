ALTER TABLE selections ADD COLUMN polygon TEXT
  CHECK (polygon IS NULL OR (
    json_type(polygon) = 'array' AND
    json_array_length(polygon) >= 4 AND
    json_extract(polygon, '$[0]') IS json_extract(polygon, '$[#-1]')
  ));

CREATE TRIGGER insert_selections_polygon
  AFTER INSERT ON selections
  WHEN NEW.polygon IS NOT NULL
  BEGIN
    UPDATE selections
      SET x = (SELECT min(json_extract(value, '$[0]')) FROM json_each(NEW.polygon)),
          y = (SELECT min(json_extract(value, '$[1]')) FROM json_each(NEW.polygon))
      WHERE id = NEW.id;
    UPDATE images
      SET width = (
            SELECT max(json_extract(value, '$[0]')) - min(json_extract(value, '$[0]'))
            FROM json_each(NEW.polygon)),
          height = (
            SELECT max(json_extract(value, '$[1]')) - min(json_extract(value, '$[1]'))
            FROM json_each(NEW.polygon))
      WHERE id = NEW.id;
  END;

CREATE TRIGGER update_selections_polygon
  AFTER UPDATE OF polygon ON selections
  WHEN NEW.polygon IS NOT NULL
  BEGIN
    UPDATE selections
      SET x = (SELECT min(json_extract(value, '$[0]')) FROM json_each(NEW.polygon)),
          y = (SELECT min(json_extract(value, '$[1]')) FROM json_each(NEW.polygon))
      WHERE id = NEW.id;
    UPDATE images
      SET width = (
            SELECT max(json_extract(value, '$[0]')) - min(json_extract(value, '$[0]'))
            FROM json_each(NEW.polygon)),
          height = (
            SELECT max(json_extract(value, '$[1]')) - min(json_extract(value, '$[1]'))
            FROM json_each(NEW.polygon))
      WHERE id = NEW.id;
  END;
