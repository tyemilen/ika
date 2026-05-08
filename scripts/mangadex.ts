const API_BASE = 'http://localhost:3000';
const API_TOKEN = process.env.API_TOKEN || 'das';

if (!API_TOKEN) {
	throw new Error('Missing API_TOKEN');
}

const fetchJSON = async (url: string) => {
	const res = await fetch(url);

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Fetch failed ${res.status}\nURL: ${url}\n${text}`);
	}

	return res.json();
};

const downloadBuffer = async (url: string) => {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Download failed: ${url}`);
	return new Uint8Array(await res.arrayBuffer());
};

const mangaIdFromUrl = (url: string) => {
	const m = url.match(/title\/([a-f0-9-]+)/i);
	if (!m) throw new Error('Invalid MangaDex URL');
	return m[1];
};

let META: any;

const loadMeta = async () => {
	META = await fetchJSON(`${API_BASE}/api/meta`);
};

const fetchManga = async (id: string) => {
	const res = await fetchJSON(
		`https://api.mangadex.org/manga/${id}?includes[]=cover_art&includes[]=artist&includes[]=author`,
	);

	return res.data;
};

const getCover = (mangaId: string, manga: any) => {
	const cover = manga.relationships.find((r: any) => r.type === 'cover_art');
	const file = cover?.attributes?.fileName;
	if (!file) return null;

	return `https://uploads.mangadex.org/covers/${mangaId}/${file}`;
};

const fetchChapters = async (mangaId: string) => {
	let offset = 0;
	const limit = 100;
	const all: any[] = [];

	while (true) {
		const url =
			`https://api.mangadex.org/chapter` +
			`?manga=${mangaId}` +
			`&limit=100` +
			`&offset=${offset}` +
			`&order[chapter]=asc`;

		const res = await fetchJSON(url);

		all.push(...res.data);

		offset += limit;
		if (offset >= res.total) break;
	}

	return all;
};

const fetchPages = async (chapterId: string) => {
	const atHome = await fetchJSON(`https://api.mangadex.org/at-home/server/${chapterId}`);

	const base = atHome.baseUrl;
	const hash = atHome.chapter.hash;

	return atHome.chapter.data.map((f: string) => `${base}/data/${hash}/${f}`);
};

// -------------------- mapping --------------------

const mapTags = (tags: any[]) => {
	const genres: string[] = [];
	const themes: string[] = [];

	for (const t of tags || []) {
		const name = t.attributes.name.en?.toLowerCase();

		const g = META.genres.find((x: any) => x.name === name);
		if (g) genres.push(g.id);

		const th = META.themes.find((x: any) => x.name === name);
		if (th) themes.push(th.id);
	}

	return { genres, themes };
};

const createBook = async (payload: any) => {
	const form = new FormData();

	for (const [k, v] of Object.entries(payload)) {
		if (k === 'cover') form.append('cover', v as any);
		else form.append(k, typeof v === 'string' ? v : JSON.stringify(v));
	}

	const res = await fetch(`${API_BASE}/api/books`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${API_TOKEN}`,
		},
		body: form,
	});

	if (!res.ok) {
		console.log(await res.text());
		throw new Error('Book creation failed');
	}

	const bookId = await res.json().then((r) => r.id);

	await fetch(`${API_BASE}/api/books/drafts/${bookId}/publish`, {
		method: 'PATCH',
		headers: {
			Authorization: `Bearer ${API_TOKEN}`,
		},
	});

	await fetch(`${API_BASE}/api/special/drafts/${bookId}/publish`, {
		method: 'PATCH',
		headers: {
			Authorization: `Bearer ${API_TOKEN}`,
		},
	});

	return { id: bookId };
};

const createChapter = async (bookId: string, chapter: any, files: File[]) => {
	const form = new FormData();

	form.append('number', String(chapter.number));
	form.append('volume', String(chapter.volume));
	form.append('name', chapter.name);
	form.append('language', chapter.language);

	for (const f of files) {
		form.append('pages', f);
	}

	const res = await fetch(`${API_BASE}/api/books/${bookId}/chapter`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${API_TOKEN}`,
		},
		body: form,
	});

	if (!res.ok) {
		console.log(await res.text());
		throw new Error('Chapter upload failed');
	}
};

const run = async () => {
	const [, , url] = process.argv;
	if (!url) throw new Error('Missing URL');

	await loadMeta();

	const mangaId = mangaIdFromUrl(url);

	console.log('Fetching manga...');
	const manga = await fetchManga(mangaId);

	const { genres, themes } = mapTags(manga.attributes.tags);

	console.log('Downloading cover...');
	const coverUrl = getCover(mangaId, manga);
	if (!coverUrl) throw new Error('No cover found');

	const coverBuf = await downloadBuffer(coverUrl);

	const coverFile = new File([coverBuf], 'cover.jpg', {
		type: 'image/jpeg',
	});

	const artists = manga.relationships
		.filter((r: any) => r.type === 'artist')
		.map((r: any) => r.attributes?.name)
		.filter(Boolean);

	if (!artists.length) artists.push('Unknown');

	console.log('Creating book...');
	console.log(manga.attributes);
	const book = await createBook({
		title: manga.attributes.title.en || Object.values(manga.attributes.title)[0] || 'Untitled',

		titleLang: META.languages.find((l: any) => l.code === 'en')?.id,
		language: META.languages.find((l: any) => l.code === 'en')?.id,

		authorsIds: [],
		authorsNames: artists,

		artistsIds: [],
		artistsNames: artists,

		genres,
		themes,

		publicationYear: manga.attributes.year || new Date().getFullYear(),
		publicationStatus: manga.attributes.status == 'hiatus' ? 'paused' : manga.attributes.status,

		titles: [],
		descriptions: [
			{
				language: META.languages.find((l: any) => l.code === 'en')?.id,
				content: manga.attributes.description?.en || '',
			},
		],

		cover: coverFile,
	});

	console.log('Book created:', book.id);

	console.log('Fetching chapters...');
	const chapters = await fetchChapters(mangaId);

	for (const ch of chapters) {
		const a = ch.attributes;

		const pages = await fetchPages(ch.id);

		const files: File[] = [];

		for (let i = 0; i < pages.length; i++) {
			const buf = await downloadBuffer(pages[i]);
			files.push(
				new File([new Blob([buf])], `${i}.jpg`, {
					type: 'image/jpeg',
				}),
			);
		}

		if (ch.attributes.externalUrl || ch.attributes.isUnavailable) {
			console.log(`skipping ${a.chapter}`);
			continue;
		}

		if (!META.languages.find((l: any) => l.code === ch.attributes.translatedLanguage)?.id) {
			console.log('unknown lang:', ch.attributes.translatedLanguage);
			continue;
		}

		await createChapter(
			book.id,
			{
				number: Number(a.chapter || 0),
				volume: Number(a.volume || 0),
				name: a.title || `Chapter ${a.chapter}`,
				language: META.languages.find(
					(l: any) => l.code === ch.attributes.translatedLanguage,
				)?.id,
			},
			files,
		);

		console.log(`Uploaded chapter ${a.chapter}`);
	}

	console.log('Done');
};

run().catch((e) => {
	console.error(e);
	process.exit(1);
});
