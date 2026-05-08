-- Custom SQL migration file, put your code below! --
INSERT INTO "meta"."metaGenres" ("name") VALUES
	('action'), ('adventure'), ('boys_love'), ('comedy'), ('crime'),
	('drama'), ('fantasy'), ('girls_love'), ('historical'), ('horror'),
	('isekai'), ('magical_girls'), ('mecha'), ('medical'), ('mystery'),
	('philosophical'), ('psychological'), ('romance'), ('sci_fi'),
	('slice_of_life'), ('sports'), ('superhero'), ('thriller'), ('tragedy'),
	('wuxia')
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
INSERT INTO "meta"."metaThemes" ("name") VALUES
	('aliens'), ('animals'), ('cooking'), ('crossdressing'), ('delinquents'),
	('demons'), ('genderswap'), ('ghosts'), ('gyaru'), ('harem'),
	('mafia'), ('magic'), ('mahjong'), ('martial_arts'), ('military'),
	('monster_girls'), ('monsters'), ('music'), ('ninja'), ('office_workers'),
	('police'), ('post_apocalyptic'), ('reincarnation'), ('reverse_harem'),
	('samurai'), ('school_life'), ('supernatural'), ('survival'),
	('time_travel'), ('traditional_games'), ('vampires'), ('video_games'),
	('villainess'), ('virtual_reality'), ('zombies')
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
INSERT INTO "meta"."metaLanguages" ("code") VALUES
	('ja-ro'), ('ko-ro'), ('zh-ro'), ('en'), ('af'), ('sq'), ('ar'), ('az'), 
	('eu'), ('be'), ('bn'), ('bg'), ('my'), ('ca'), ('zh-hans'), ('zh-hant'), 
	('cv'), ('hr'), ('cs'), ('da'), ('nl'), ('eo'), ('et'), ('fil'), ('fi'), 
	('fr'), ('ka'), ('de'), ('el'), ('he'), ('hi'), ('hu'), ('id'), ('ga'), 
	('it'), ('ja'), ('jv'), ('kk'), ('ko'), ('la'), ('lt'), ('ms'), ('mn'), 
	('ne'), ('no'), ('fa'), ('pl'), ('pt'), ('pt-br'), ('ro'), ('ru'), ('sr'), 
	('sk'), ('sl'), ('es'), ('es-419'), ('sv'), ('ta'), ('te'), ('th'), ('tr'), 
	('uk'), ('ur'), ('uz'), ('vi')
ON CONFLICT ("code") DO NOTHING;