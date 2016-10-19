
CREATE VIRTUAL TABLE ft_metadata USING fts5(
  id UNINDEXED,
  title,
  names,
  other
);


CREATE VIRTUAL TABLE ft_notes USING fts5(
  id UNINDEXED,
  text,
  content='notes'
);

CREATE TRIGGER ai_notes_index
  AFTER INSERT ON notes
  BEGIN
    INSERT INTO ft_notes (rowid, id, text)
      VALUES (NEW.note_id, NEW.id, NEW.text);
  END;

CREATE TRIGGER ad_notes_index
  AFTER DELETE ON notes
  BEGIN
    INSERT INTO ft_notes (ft_notes, rowid, id, text)
      VALUES ('delete', OLD.note_id, OLD.id, OLD.text);
  END;

CREATE TRIGGER au_notes_index
  AFTER UPDATE ON notes
  BEGIN
    INSERT INTO ft_notes (fts_notes, rowid, id, text)
      VALUES ('delete', OLD.note_id, OLD.id, OLD.text);
    INSERT INTO ft_notes (rowid, id, text)
      VALUES (NEW.note_id, NEW.id, NEW.text);
  END;
