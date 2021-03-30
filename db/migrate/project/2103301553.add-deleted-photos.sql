CREATE TABLE IF NOT EXISTS deleted_photos (
  path TEXT NOT NULL,
  checksum TEXT NOT NULL,
  deleted NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS delete_photos_store
  AFTER DELETE ON photos
  FOR EACH ROW WHEN OLD.protocol = 'file' AND OLD.path NOT NULL
  BEGIN
    INSERT INTO deleted_photos (path, checksum)
      VALUES (OLD.path, OLD.checksum);
  END;
