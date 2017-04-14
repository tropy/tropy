
-- Notes Index
-- ------------------------------------------------------------

CREATE VIRTUAL TABLE fts_notes USING fts5(
  id UNINDEXED,
  text,
  language UNINDEXED,
  content='notes',
  content_rowid='note_id'
);

CREATE TRIGGER notes_ai_fts
  AFTER INSERT ON notes
  BEGIN
    INSERT INTO fts_notes (rowid, id, text, language)
      VALUES (NEW.note_id, NEW.id, NEW.text, NEW.language);
  END;

CREATE TRIGGER notes_ad_fts
  AFTER DELETE ON notes
  BEGIN
    INSERT INTO fts_notes (fts_notes, rowid, id, text, language)
      VALUES ('delete', OLD.note_id, OLD.id, OLD.text, OLD.language);
  END;

CREATE TRIGGER notes_au_fts
  AFTER UPDATE OF text ON notes
  BEGIN
    INSERT INTO fts_notes (fts_notes, rowid, id, text, language)
      VALUES ('delete', OLD.note_id, OLD.id, OLD.text, OLD.language);
    INSERT INTO fts_notes (rowid, id, text, language)
      VALUES (NEW.note_id, NEW.id, NEW.text, NEW.language);
  END;


-- Metadata Value Index
-- ------------------------------------------------------------

CREATE VIRTUAL TABLE fts_metadata_values USING fts5(
  type_name UNINDEXED,
  text,
  content='metadata_values',
  content_rowid='value_id'
);

CREATE TRIGGER metadata_values_ai_fts
  AFTER INSERT ON metadata_values
  FOR EACH ROW WHEN NEW.type_name NOT IN ('boolean', 'location')
  BEGIN
    INSERT INTO fts_metadata_values (rowid, type_name, text)
      VALUES (NEW.value_id, NEW.type_name, NEW.text);
  END;

CREATE TRIGGER metadata_values_ad_fts
  AFTER DELETE ON metadata_values
  FOR EACH ROW WHEN OLD.type_name NOT IN ('boolean', 'location')
  BEGIN
    INSERT INTO fts_metadata_values (fts_metadata_values, rowid, type_name, text)
      VALUES ('delete', OLD.value_id, OLD.type_name, OLD.text);
  END;
