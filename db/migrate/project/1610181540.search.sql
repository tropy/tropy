
-- Notes Index
-- ------------------------------------------------------------

CREATE VIRTUAL TABLE fts_notes USING fts5(
  id UNINDEXED,
  text,
  language UNINDEXED,
  content = 'notes',
  content_rowid = 'note_id',
  tokenize = 'porter unicode61'
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

CREATE VIRTUAL TABLE fts_metadata USING fts5(
  datatype UNINDEXED,
  text,
  content = 'metadata_values',
  content_rowid = 'value_id',
  tokenize = 'porter unicode61'
);

CREATE TRIGGER metadata_values_ai_fts
  AFTER INSERT ON metadata_values
  FOR EACH ROW WHEN NEW.datatype NOT IN (
    'http://www.w3.org/2001/XMLSchema#boolean',
    'http://www.w3.org/2001/XMLSchema#hexBinary',
    'http://www.w3.org/2001/XMLSchema#base64Binary',
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#HTML',
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral')
  BEGIN
    INSERT INTO fts_metadata (rowid, datatype, text)
      VALUES (NEW.value_id, NEW.datatype, NEW.text);
  END;

CREATE TRIGGER metadata_values_ad_fts
  AFTER DELETE ON metadata_values
  FOR EACH ROW WHEN OLD.datatype NOT IN (
    'http://www.w3.org/2001/XMLSchema#boolean',
    'http://www.w3.org/2001/XMLSchema#hexBinary',
    'http://www.w3.org/2001/XMLSchema#base64Binary',
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#HTML',
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral')
  BEGIN
    INSERT INTO fts_metadata (fts_metadata, rowid, datatype, text)
      VALUES ('delete', OLD.value_id, OLD.datatype, OLD.text);
  END;
