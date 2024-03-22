CREATE TABLE transcriptions (
  transcription_id  INTEGER PRIMARY KEY,
  id                INTEGER NOT NULL REFERENCES images ON DELETE CASCADE,
  text              TEXT,
  config            TEXT,
  data              TEXT,
  status            NUMERIC NOT NULL DEFAULT 0,
  deleted           NUMERIC,
  created           NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified          NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE VIRTUAL TABLE fts_transcriptions USING fts5(
  id UNINDEXED,
  text,
  content = 'transcriptions',
  content_rowid = 'transcription_id',
  tokenize = 'unicode61'
);

CREATE TRIGGER transcriptions_ai_fts
  AFTER INSERT ON transcriptions
  BEGIN
    INSERT INTO fts_transcriptions (rowid, id, text)
      VALUES (NEW.transcription_id, NEW.id, NEW.text);
  END;
CREATE TRIGGER transcriptions_au_fts
  AFTER UPDATE OF text ON transcriptions
  BEGIN
    INSERT INTO fts_transcriptions (fts_transcriptions, rowid, id, text)
      VALUES ('delete', OLD.transcription_id, OLD.id, OLD.text);
    INSERT INTO fts_transcriptions (rowid, id, text)
      VALUES (NEW.transcription_id, NEW.id, NEW.text);
  END;
CREATE TRIGGER transcriptions_ad_fts
  AFTER DELETE ON transcriptions
  BEGIN
    INSERT INTO fts_transcriptions (fts_transcriptions, rowid, id, text)
      VALUES ('delete', OLD.transcription_id, OLD.id, OLD.text);
  END;
