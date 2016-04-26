CREATE TABLE languages (
  language_code TEXT NOT NULL COLLATE NOCASE PRIMARY KEY
) WITHOUT ROWID;


INSERT INTO languages (language_code) VALUES
  ('aa'), ('ab'), ('ae'), ('af'), ('am'), ('an'), ('ar'), ('as'), ('ay'),
  ('az'), ('ba'), ('be'), ('bg'), ('bh'), ('bi'), ('bn'), ('bo'), ('br'),
  ('bs'), ('ca'), ('ce'), ('ch'), ('co'), ('cs'), ('cu'), ('cv'), ('cy'),
  ('da'), ('de'), ('dv'), ('dz'), ('el'), ('en'), ('eo'), ('es'), ('et'),
  ('eu'), ('fa'), ('fi'), ('fj'), ('fo'), ('fr'), ('fy'), ('ga'), ('gd'),
  ('gl'), ('gn'), ('gu'), ('gv'), ('ha'), ('he'), ('hi'), ('ho'), ('hr'),
  ('ht'), ('hu'), ('hy'), ('hz'), ('ia'), ('id'), ('ie'), ('ii'), ('ik'),
  ('io'), ('is'), ('it'), ('iu'), ('ja'), ('jv'), ('ka'), ('ki'), ('kj'),
  ('kk'), ('kl'), ('km'), ('kn'), ('ko'), ('ks'), ('ku'), ('kv'), ('kw'),
  ('ky'), ('la'), ('lb'), ('li'), ('ln'), ('lo'), ('lt'), ('lv'), ('mg'),
  ('mh'), ('mi'), ('mk'), ('ml'), ('mn'), ('mo'), ('mr'), ('ms'), ('mt'),
  ('my'), ('na'), ('nb'), ('nd'), ('ne'), ('ng'), ('nl'), ('nn'), ('no'),
  ('nr'), ('nv'), ('ny'), ('oc'), ('om'), ('or'), ('os'), ('pa'), ('pi'),
  ('pl'), ('ps'), ('pt'), ('qu'), ('rm'), ('rn'), ('ro'), ('ru'), ('rw'),
  ('sa'), ('sc'), ('sd'), ('se'), ('sg'), ('si'), ('sk'), ('sl'), ('sm'),
  ('sn'), ('so'), ('sq'), ('sr'), ('ss'), ('st'), ('su'), ('sv'), ('sw'),
  ('ta'), ('te'), ('tg'), ('th'), ('ti'), ('tk'), ('tl'), ('tn'), ('to'),
  ('tr'), ('ts'), ('tt'), ('tw'), ('ty'), ('ug'), ('uk'), ('ur'), ('uz'),
  ('vi'), ('vo'), ('wa'), ('wo'), ('xh'), ('yi'), ('yo'), ('za'), ('zh'),
  ('zu');
