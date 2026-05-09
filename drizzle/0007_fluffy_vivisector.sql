ALTER TYPE "books"."book_status" ADD VALUE 'hidden';--> statement-breakpoint
ALTER TABLE "users"."reading_history" DROP CONSTRAINT "reading_history_chapter_id_chapters_id_fk";
--> statement-breakpoint
DROP INDEX "users"."reading_history_user_updated_idx";--> statement-breakpoint
DROP INDEX "users"."reading_history_user_book_idx";--> statement-breakpoint
ALTER TABLE "users"."reading_history" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users"."reading_history" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users"."reading_history" ADD CONSTRAINT "reading_history_user_book_pk" PRIMARY KEY("user_id","book_id");--> statement-breakpoint
CREATE INDEX "reading_history_user_last_read_idx" ON "users"."reading_history" USING btree ("user_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "reading_history_last_read_book_idx" ON "users"."reading_history" USING btree ("updated_at" DESC NULLS LAST,"book_id");--> statement-breakpoint
CREATE INDEX "reading_history_book_last_read_idx" ON "users"."reading_history" USING btree ("book_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "users"."reading_history" DROP COLUMN "chapter_id";