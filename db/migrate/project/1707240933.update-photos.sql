ALTER TABLE photos ADD COLUMN size INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_photos_checksum ON photos (checksum);
