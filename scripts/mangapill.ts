import * as cheerio from 'cheerio';

const API_BASE = 'http://localhost:3000';
const API_TOKEN = process.env.API_TOKEN || 'das';
const MANGAPILL_BASE = 'https://mangapill.com';

if (!API_TOKEN) {
	throw new Error('Missing API_TOKEN');
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const robustFetch = async (
	url: string,
	options: RequestInit = {},
	retries = 30,
): Promise<Response> => {
	for (let i = 0; i < retries; i++) {
		try {
			const res = await fetch(url, {
				...options,
				signal: AbortSignal.timeout(30000),
			});

			if (!res.ok && (res.status >= 500 || res.status === 429)) {
				throw new Error(`Server returned ${res.status}`);
			}

			return res;
		} catch (err) {
			const isLastRepo = i === retries - 1;
			if (isLastRepo) throw err;

			const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
			console.warn(
				`[Retry ${i + 1}/${retries}] Failed to fetch ${url}. Retrying in ${Math.round(waitTime)}ms...`,
			);
			await sleep(waitTime);
		}
	}
	throw new Error('Unreachable');
};

const fetchJSON = async (url: string) => {
	const res = await robustFetch(url);
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Fetch failed ${res.status}\nURL: ${url}\n${text}`);
	}
	return res.json();
};

const downloadBuffer = async (url: string) => {
	const res = await robustFetch(url, {
		headers: { Referer: MANGAPILL_BASE },
	});
	if (!res.ok) throw new Error(`Download failed: ${url}`);
	return new Uint8Array(await res.arrayBuffer());
};

let META: any;
const loadMeta = async () => {
	META = await fetchJSON(`${API_BASE}/api/meta`);
};

const scrapeManga = async (url: string) => {
	const res = await robustFetch(url);
	const html = await res.text();
	const $ = cheerio.load(html);

	const title = $('h1.font-bold').first().text().trim() || 'Untitled';
	const coverImg = $('div.w-60 img').first();
	const coverUrl = coverImg.attr('data-src') || coverImg.attr('src');

	const descP = $('p.text-sm.text--secondary');
	let description = descP.text().trim();
	if (description.includes('The ')) {
		description = 'The ' + description.split('The ').slice(1).join('The ');
	}

	const rawTags: string[] = [];
	$("a[href^='/search?genre=']").each((_, el) => {
		rawTags.push($(el).text().trim().toLowerCase());
	});

	const info: Record<string, string> = {};
	$('div.grid > div').each((_, el) => {
		const label = $(el).find('label').text().trim();
		const value = $(el).find('div').text().trim();
		if (label && value) info[label] = value;
	});

	const rawStatus = info['Status']?.toLowerCase() || '';
	let status = 'ongoing';
	if (rawStatus.includes('finished') || rawStatus.includes('complete')) status = 'completed';
	else if (rawStatus.includes('hiatus') || rawStatus.includes('paused')) status = 'paused';
	else if (rawStatus.includes('cancelled') || rawStatus.includes('dropped')) status = 'cancelled';

	const chapters: any[] = [];
	$('#chapters a[href^="/chapters/"]').each((_, el) => {
		const text = $(el).text().trim();
		const href = $(el).attr('href') || '';
		const numMatch = text.match(/Chapter\s*([\d.]+)/i);
		chapters.push({
			title: text,
			url: MANGAPILL_BASE + href,
			number: numMatch ? numMatch[1] : '0',
		});
	});

	return {
		title,
		description,
		coverUrl,
		rawTags,
		year: parseInt(info['Year'] || '') || new Date().getFullYear(),
		status,
		chapters: chapters.reverse(),
	};
};

const fetchPages = async (chapterUrl: string) => {
	const res = await robustFetch(chapterUrl);
	const html = await res.text();
	const $ = cheerio.load(html);
	const pages: string[] = [];
	$('img.js-page').each((_, el) => {
		const src = $(el).attr('data-src') || $(el).attr('src');
		if (src) pages.push(src);
	});
	return pages;
};

const run = async () => {
	const [, , url] = process.argv;
	if (!url) throw new Error('Missing URL');

	await loadMeta();
	console.log('Scraping Mangapill...');
	const manga = await scrapeManga(url);

	const englishLangId = META.languages.find((l: any) => l.code === 'en')?.id;
	if (!englishLangId) throw new Error('Could not find English language ID in meta');

	const genres: string[] = [];
	const themes: string[] = [];
	for (const name of manga.rawTags) {
		const g = META.genres.find((x: any) => x.name.toLowerCase() === name);
		if (g) genres.push(g.id);
		const th = META.themes.find((x: any) => x.name.toLowerCase() === name);
		if (th) themes.push(th.id);
	}

	if (genres.length === 0 && META.genres.length > 0) {
		genres.push(META.genres[0].id);
	}

	console.log('Downloading cover...');
	if (!manga.coverUrl) throw new Error('No cover found');
	const coverBuf = await downloadBuffer(manga.coverUrl);
	const coverFile = new File([coverBuf], 'cover.jpg', { type: 'image/jpeg' });

	console.log('Creating book...');
	const form = new FormData();
	form.append('title', manga.title);
	form.append('titleLang', englishLangId);
	form.append('language', englishLangId);
	form.append('publicationYear', String(manga.year));
	form.append('authorsIds', JSON.stringify([]));
	form.append('authorsNames', JSON.stringify(['Unknown']));
	form.append('artistsIds', JSON.stringify([]));
	form.append('artistsNames', JSON.stringify(['Unknown']));
	form.append('genres', JSON.stringify(genres));
	form.append('themes', JSON.stringify(themes));
	form.append('titles', JSON.stringify([]));
	form.append(
		'descriptions',
		JSON.stringify([{ language: englishLangId, content: manga.description || manga.title }]),
	);
	form.append('publicationStatus', JSON.stringify(manga.status));
	form.append('cover', coverFile);

	const res = await robustFetch(`${API_BASE}/api/books`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${API_TOKEN}` },
		body: form,
	});

	if (!res.ok) {
		const err = await res.text();
		console.error('Schema Validation Error:', err);
		throw new Error(`Book creation failed: ${res.status}`);
	}

	const bookId = (await res.json()).id;

	await robustFetch(`${API_BASE}/api/books/drafts/${bookId}/publish`, {
		method: 'PATCH',
		headers: { Authorization: `Bearer ${API_TOKEN}` },
	});
	await robustFetch(`${API_BASE}/api/special/drafts/${bookId}/publish`, {
		method: 'PATCH',
		headers: { Authorization: `Bearer ${API_TOKEN}` },
	});

	console.log('Book ID:', bookId);

	for (const ch of manga.chapters) {
		try {
			console.log(`Processing ${ch.title}...`);
			const pages = await fetchPages(ch.url);
			const files: File[] = [];

			for (let i = 0; i < pages.length; i++) {
				const buf = await downloadBuffer(pages[i]);
				files.push(new File([new Blob([buf])], `${i}.jpg`, { type: 'image/jpeg' }));
				await sleep(200);
			}

			const chForm = new FormData();
			chForm.append('number', String(ch.number));
			chForm.append('volume', '0');
			chForm.append('name', ch.title);
			chForm.append('language', englishLangId);
			for (const f of files) chForm.append('pages', f);

			const uploadRes = await robustFetch(`${API_BASE}/api/books/${bookId}/chapter`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${API_TOKEN}` },
				body: chForm,
			});

			if (!uploadRes.ok) throw new Error(`Failed to upload chapter ${ch.number}`);

			console.log(`Successfully Uploaded ${ch.title}`);
			await sleep(1000);
		} catch (error) {
			console.error(`CRITICAL: Failed to process ${ch.title}. Skipping to next.`, error);
		}
	}

	console.log('All available chapters processed.');
};

run().catch(console.error);
