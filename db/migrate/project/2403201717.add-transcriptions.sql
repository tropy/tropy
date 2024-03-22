CREATE TABLE transcriptions (
  transcription_id  INTEGER PRIMARY KEY,
  id                INTEGER NOT NULL REFERENCES images ON DELETE CASCADE,
  text              TEXT,
  config            TEXT,
  data              TEXT,
  status            TEXT,
  created           NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified          NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE VIRTUAL TABLE fts_transactions USING fts5(
  id UNINDEXED,
  text,
  content = 'transcriptions',
  content_rowid = 'transcription_id'
);
