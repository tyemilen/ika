DROP TRIGGER IF EXISTS tr_chapter_added ON "chapters"."chapters";
DROP TRIGGER IF EXISTS tr_my_book_status_updated ON "books"."books";
DROP FUNCTION IF EXISTS notify_chapter_added;
DROP FUNCTION IF EXISTS notify_my_book_status_updated;

CREATE OR REPLACE FUNCTION notify_chapter_added() RETURNS trigger AS $$
DECLARE
	notif_id uuid;
	v_cover_id uuid;
	v_book_title text;
BEGIN
	SELECT id INTO v_cover_id 
	FROM "books"."covers" 
	WHERE book_id = NEW.book_id 
	ORDER BY is_primary DESC 
	LIMIT 1;
	
	SELECT name INTO v_book_title 
	FROM "books"."titles"
	WHERE book_id = NEW.book_id 
	ORDER BY is_primary DESC
	LIMIT 1;

	WITH inserted_rows AS (
		INSERT INTO "users"."notifications" (user_id, type, data)
		SELECT sb.user_id,
			'new_chapter',
			jsonb_build_object(
				'book_title', v_book_title,
				'book_id', NEW.book_id,
				'cover_id', v_cover_id,
				'chapter_id', NEW.id,
				'name', NEW.name,
				'volume', NEW.volume,
				'number', NEW.number
			)
		FROM "users"."shelf_books" sb
			JOIN "users"."shelves" s ON s.id = sb.shelf_id
		WHERE sb.book_id = NEW.book_id
			AND s.type = 'liked'
		RETURNING id
	)
	SELECT id INTO notif_id FROM inserted_rows LIMIT 1;

	IF notif_id IS NOT NULL THEN
		PERFORM pg_notify('new_chapter', notif_id::text);
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_my_book_status_updated() RETURNS trigger AS $$
DECLARE 
	notif_id uuid;
	v_title text;
	v_cover_id uuid;
BEGIN 
	IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status != 'queue' AND NEW.created_by IS NOT NULL THEN

		SELECT name INTO v_title 
		FROM "books"."titles"
		WHERE book_id = NEW.id 
		ORDER BY is_primary DESC
		LIMIT 1;

		SELECT id INTO v_cover_id 
		FROM "books"."covers" 
		WHERE book_id = NEW.id 
		ORDER BY is_primary DESC 
		LIMIT 1;

		INSERT INTO "users"."notifications" (user_id, type, data)
		VALUES (
			NEW.created_by,
			'my_book_status_update',
			jsonb_build_object(
				'status', NEW.status,
				'title', COALESCE(v_title, 'unknown'),
				'book_id', NEW.id,
				'cover_id', v_cover_id
			)
		)
		RETURNING id INTO notif_id;
		
		IF notif_id IS NOT NULL THEN
			PERFORM pg_notify('book_update', notif_id::text);
		END IF;
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_chapter_added
AFTER
INSERT ON "chapters"."chapters" FOR EACH ROW EXECUTE FUNCTION notify_chapter_added();

CREATE TRIGGER tr_my_book_status_updated
AFTER
UPDATE OF "status",
	"publication_status" ON "books"."books" FOR EACH ROW
	WHEN (
		OLD.status IS DISTINCT
		FROM NEW.status
	) EXECUTE FUNCTION notify_my_book_status_updated();
