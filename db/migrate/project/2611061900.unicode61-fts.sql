-- Language-neutral full-text search for all three indices:
-- unicode61 without Porter stemming (English only),
-- removing diacritics from all characters (remove_diacritics 2).
-- The triggers write to the tables by name; only the metadata
-- triggers change (no datatype filter).

DROP TABLE fts_notes;

CREATE VIRTUAL TABLE fts_notes USING fts5(
  id UNINDEXED,
  text,
  language UNINDEXED,
  content = 'notes',
  content_rowid = 'note_id',
  tokenize = 'unicode61 remove_diacritics 2'
);

INSERT INTO fts_notes(fts_notes) VALUES ('rebuild');


DROP TABLE fts_metadata;

CREATE VIRTUAL TABLE fts_metadata USING fts5(
  datatype UNINDEXED,
  text,
  content = 'metadata_values',
  content_rowid = 'value_id',
  tokenize = 'unicode61 remove_diacritics 2'
);

-- All values are indexed (the triggers skipped some datatypes),
-- so that 'rebuild' and the triggers agree.
DROP TRIGGER metadata_values_ai_fts;
DROP TRIGGER metadata_values_ad_fts;

CREATE TRIGGER metadata_values_ai_fts
  AFTER INSERT ON metadata_values
  BEGIN
    INSERT INTO fts_metadata (rowid, datatype, text)
      VALUES (NEW.value_id, NEW.datatype, NEW.text);
  END;

CREATE TRIGGER metadata_values_ad_fts
  AFTER DELETE ON metadata_values
  BEGIN
    INSERT INTO fts_metadata (fts_metadata, rowid, datatype, text)
      VALUES ('delete', OLD.value_id, OLD.datatype, OLD.text);
  END;

INSERT INTO fts_metadata(fts_metadata) VALUES ('rebuild');


DROP TABLE fts_transcriptions;

CREATE VIRTUAL TABLE fts_transcriptions USING fts5(
  id UNINDEXED,
  text,
  content = 'transcriptions',
  content_rowid = 'transcription_id',
  tokenize = 'unicode61 remove_diacritics 2'
);

INSERT INTO fts_transcriptions(fts_transcriptions) VALUES ('rebuild');
