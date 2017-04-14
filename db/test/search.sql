PRAGMA foreign_keys = on;

SELECT item_id AS item,
    photos.id AS photo,
    fts_notes.rowid AS note
  FROM fts_notes JOIN photos USING (id)
  WHERE fts_notes MATCH 'query';

SELECT coalesce(items.id, item_id) AS item,
    photos.id AS photo
  FROM metadata
    JOIN fts_metadata ON (value_id = fts_metadata.rowid)
    LEFT OUTER JOIN items USING (id)
    LEFT OUTER JOIN photos USING (id)
  WHERE fts_metadata MATCH 'query';


SELECT item_id AS id
  FROM fts_notes JOIN photos USING (id)
  WHERE fts_notes MATCH 'query'

UNION

SELECT coalesce(items.id, item_id) AS id
  FROM metadata
    JOIN fts_metadata ON (value_id = fts_metadata.rowid)
    LEFT OUTER JOIN items USING (id)
    LEFT OUTER JOIN photos USING (id)
  WHERE fts_metadata MATCH 'query';
