CREATE SCHEMA "users";
--> statement-breakpoint
CREATE SCHEMA "meta";
--> statement-breakpoint
CREATE SCHEMA "drafts";
--> statement-breakpoint
CREATE SCHEMA "books";
--> statement-breakpoint
CREATE SCHEMA "chapters";
--> statement-breakpoint
CREATE TYPE "users"."user_role" AS ENUM('admin', 'moderator', 'user');--> statement-breakpoint
CREATE TYPE "users"."shelf_type" AS ENUM('liked', 'user', 'generated');--> statement-breakpoint
CREATE TYPE "books"."publication_status" AS ENUM('ongoing', 'completed', 'paused', 'cancelled');--> statement-breakpoint
CREATE TYPE "books"."book_status" AS ENUM('draft', 'queue', 'rejected', 'published');--> statement-breakpoint
CREATE TABLE "users"."users" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"username" varchar(32) NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" "users"."user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users"."profiles" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" varchar(32) NOT NULL,
	"bio" text,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users"."shelf_books" (
	"user_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"shelf_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shelf_books_shelf_id_user_id_book_id_pk" PRIMARY KEY("shelf_id","user_id","book_id")
);
--> statement-breakpoint
CREATE TABLE "users"."shelves" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"type" "users"."shelf_type" DEFAULT 'user' NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta"."metaArtists" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"slug" varchar(156) NOT NULL,
	"name" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "metaArtists_slug_unique" UNIQUE("slug"),
	CONSTRAINT "metaArtists_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "meta"."metaAuthors" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"slug" varchar(156) NOT NULL,
	"name" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "metaAuthors_slug_unique" UNIQUE("slug"),
	CONSTRAINT "metaAuthors_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "meta"."metaGenres" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "metaGenres_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "meta"."metaThemes" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "metaThemes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "meta"."metaLanguages" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "metaLanguages_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "drafts"."artists" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"book_id" uuid NOT NULL,
	"name" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drafts"."authors" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"book_id" uuid NOT NULL,
	"name" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "books"."artists" (
	"book_id" uuid NOT NULL,
	"artist_id" uuid NOT NULL,
	CONSTRAINT "artists_book_id_artist_id_pk" PRIMARY KEY("book_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "books"."authors" (
	"book_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	CONSTRAINT "authors_book_id_author_id_pk" PRIMARY KEY("book_id","author_id")
);
--> statement-breakpoint
CREATE TABLE "books"."books" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"slug" text NOT NULL,
	"status" "books"."book_status" DEFAULT 'draft' NOT NULL,
	"publication_status" "books"."publication_status" NOT NULL,
	"language" uuid NOT NULL,
	"publication_year" integer NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"average_rating" numeric(4, 2) DEFAULT 0 NOT NULL,
	"total_ratings" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reject_reason" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "books_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "books"."descriptions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"book_id" uuid NOT NULL,
	"name" text NOT NULL,
	"lang_id" uuid NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "books"."genres" (
	"book_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "genres_book_id_genre_id_pk" PRIMARY KEY("book_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "books"."themes" (
	"book_id" uuid NOT NULL,
	"theme_id" uuid NOT NULL,
	CONSTRAINT "themes_book_id_theme_id_pk" PRIMARY KEY("book_id","theme_id")
);
--> statement-breakpoint
CREATE TABLE "books"."titles" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"book_id" uuid NOT NULL,
	"name" text NOT NULL,
	"lang_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "books"."covers" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"book_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "books"."comments" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"book_id" uuid NOT NULL,
	"user_id" uuid,
	"text" varchar(512) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapters"."chapters" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"book_id" uuid NOT NULL,
	"is_oneshot" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"volume" numeric NOT NULL,
	"number" numeric NOT NULL,
	"lang_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapters"."pages" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"chapter_id" uuid NOT NULL,
	"number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapters"."comments" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"page_id" uuid NOT NULL,
	"user_id" uuid,
	"text" varchar(512) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users"."profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users"."shelf_books" ADD CONSTRAINT "shelf_books_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users"."shelf_books" ADD CONSTRAINT "shelf_books_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "books"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users"."shelf_books" ADD CONSTRAINT "shelf_books_shelf_id_shelves_id_fk" FOREIGN KEY ("shelf_id") REFERENCES "users"."shelves"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users"."shelves" ADD CONSTRAINT "shelves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts"."artists" ADD CONSTRAINT "artists_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "books"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts"."authors" ADD CONSTRAINT "authors_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "books"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books"."artists" ADD CONSTRAINT "artists_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "books"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books"."artists" ADD CONSTRAINT "artists_artist_id_metaArtists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "meta"."metaArtists"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books"."authors" ADD CONSTRAINT "authors_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "books"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books"."authors" ADD CONSTRAINT "authors_author_id_metaAuthors_id_fk" FOREIGN KEY ("author_id") REFERENCES "meta"."metaAuthors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books"."books" ADD CONSTRAINT "books_language_metaLanguages_id_fk" FOREIGN KEY ("language") REFERENCES "meta"."metaLanguages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books"."books" ADD CONSTRAINT "books_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books"."books" ADD CONSTRAINT "books_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "users"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books"."descriptions" ADD CONSTRAINT "descriptions_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "books"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books"."descriptions" ADD CONSTRAINT "descriptions_lang_id_metaLanguages_id_fk" FOREIGN KEY ("lang_id") REFERENCES "meta"."metaLanguages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books"."descriptions" ADD CONSTRAINT "descriptions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books"."genres" ADD CONSTRAINT "genres_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "books"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books"."genres" ADD CONSTRAINT "genres_genre_id_metaGenres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "meta"."metaGenres"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books"."themes" ADD CONSTRAINT "themes_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "books"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books"."themes" ADD CONSTRAINT "themes_theme_id_metaThemes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "meta"."metaThemes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books"."titles" ADD CONSTRAINT "titles_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "books"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books"."titles" ADD CONSTRAINT "titles_lang_id_metaLanguages_id_fk" FOREIGN KEY ("lang_id") REFERENCES "meta"."metaLanguages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books"."titles" ADD CONSTRAINT "titles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books"."covers" ADD CONSTRAINT "covers_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "books"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books"."comments" ADD CONSTRAINT "comments_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "books"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books"."comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters"."chapters" ADD CONSTRAINT "chapters_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "books"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters"."chapters" ADD CONSTRAINT "chapters_lang_id_metaLanguages_id_fk" FOREIGN KEY ("lang_id") REFERENCES "meta"."metaLanguages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters"."chapters" ADD CONSTRAINT "chapters_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters"."pages" ADD CONSTRAINT "pages_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "chapters"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters"."comments" ADD CONSTRAINT "comments_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "chapters"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters"."comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "shelves_user_id_liked_unique_idx" ON "users"."shelves" USING btree ("user_id") WHERE "users"."shelves"."type" = 'liked';--> statement-breakpoint
CREATE INDEX "shelves_user_id_idx" ON "users"."shelves" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "artists_artist_id_idx" ON "books"."artists" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "authors_author_id_idx" ON "books"."authors" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "books_status_idx" ON "books"."books" USING btree ("status");--> statement-breakpoint
CREATE INDEX "books_created_by_idx" ON "books"."books" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "books_created_at_idx" ON "books"."books" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "books_updated_at_idx" ON "books"."books" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "books_rating_idx" ON "books"."books" USING btree ("average_rating");--> statement-breakpoint
CREATE INDEX "books_likes_idx" ON "books"."books" USING btree ("likes_count");--> statement-breakpoint
CREATE INDEX "descriptions_book_id_idx" ON "books"."descriptions" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "descriptions_lang_id_idx" ON "books"."descriptions" USING btree ("lang_id");--> statement-breakpoint
CREATE INDEX "genres_genre_id_idx" ON "books"."genres" USING btree ("genre_id");--> statement-breakpoint
CREATE INDEX "themes_theme_id_idx" ON "books"."themes" USING btree ("theme_id");--> statement-breakpoint
CREATE INDEX "titles_book_id_idx" ON "books"."titles" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "covers_book_id_idx" ON "books"."covers" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "chapters_lang_id_idx" ON "chapters"."chapters" USING btree ("lang_id");--> statement-breakpoint
CREATE INDEX "chapters_created_at_idx" ON "chapters"."chapters" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "chapters_book_id_created_at_idx" ON "chapters"."chapters" USING btree ("book_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pages_chapter_number_unique_idx" ON "chapters"."pages" USING btree ("chapter_id","number");