
CREATE VIRTUAL TABLE fts_metadata USING fts5(
  id UNINDEXED,
  title,
  names,
  other
);


CREATE VIRTUAL TABLE fts_notes USING fts5(
  id UNINDEXED,
  text,
  content='notes',
  content_rowid='note_id'
);

CREATE TRIGGER notes_ai_idx
  AFTER INSERT ON notes
  BEGIN
    INSERT INTO fts_notes (rowid, id, text)
      VALUES (NEW.note_id, NEW.id, NEW.text);
  END;

CREATE TRIGGER notes_ad_idx
  AFTER DELETE ON notes
  BEGIN
    INSERT INTO fts_notes (fts_notes, rowid, id, text)
      VALUES ('delete', OLD.note_id, OLD.id, OLD.text);
  END;

CREATE TRIGGER notes_au_idx
  AFTER UPDATE OF text ON notes
  BEGIN
    INSERT INTO fts_notes (fts_notes, rowid, id, text)
      VALUES ('delete', OLD.note_id, OLD.id, OLD.text);
    INSERT INTO fts_notes (rowid, id, text)
      VALUES (NEW.note_id, NEW.id, NEW.text);
  END;
