-- Prune images
-- ------------------------------------------------------------
REPLACE INTO trash (id, reason)
  SELECT id, 'auto' AS reason
    FROM images
    WHERE id NOT IN (
      SELECT id FROM photos UNION SELECT id FROM selections
    );

-- ------------------------------------------------------------
-- Photo/Selection Deletion Triggers
-- ------------------------------------------------------------
-- When a photo or selection is delteded via ON CASCADE of the
-- parent item or photos, the corresponding image (and its subject,
-- metadata, notes) are not removed automatically.
-- ------------------------------------------------------------
CREATE TRIGGER delete_photos_prune_images
  AFTER DELETE ON photos
  BEGIN
    DELETE FROM subjects WHERE id = OLD.id;
  END;

CREATE TRIGGER delete_selections_prune_images
  AFTER DELETE ON selections
  BEGIN
    DELETE FROM subjects WHERE id = OLD.id;
  END;
