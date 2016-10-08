PRAGMA foreign_keys = on;

INSERT INTO subjects (template_id) VALUES (0);
INSERT INTO items (sid) VALUES (last_insert_rowid());

SELECT sid AS id, created_at
FROM items JOIN subjects USING (sid)
WHERE sid NOT IN (SELECT sid FROM trash);


SELECT sid AS id, deleted_at
FROM trash JOIN items USING (sid);
