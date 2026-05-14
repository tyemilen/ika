import * as cheerio from 'cheerio';
import { Impit } from 'impit';

const API_BASE = 'http://localhost:3000';
const API_TOKEN = process.env.API_TOKEN || 'das';

if (!API_TOKEN) {
	throw new Error('Missing API_TOKEN');
}

const client = new Impit();

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const robustFetch = async (
	url: string,
	options: RequestInit = {},
	retries = 30,
): Promise<Response> => {
	for (let i = 0; i < retries; i++) {
		try {
			const res = await client.fetch(url, {
				...options,
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
					'Accept-Language': 'en-US;q=0.7,en;q=0.3',
					Cookie: 'mangatown_template_desk=yes',
					...(options.headers || {}),
				},
				timeout: 30000,
			});

			if (!res.ok && (res.status >= 500 || res.status === 429)) {
				throw new Error(`Server returned ${res.status}`);
			}

			return res;
		} catch (err) {
			const isLastRetry = i === retries - 1;

			if (isLastRetry) {
				throw err;
			}

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
	return res.json();
};

const downloadBuffer = async (url: string, referer?: string) => {
	const res = await robustFetch(url, {
		headers: {
			Referer: referer || url,
		},
	});

	return new Uint8Array(await res.arrayBuffer());
};

let META: any;

const loadMeta = async () => {
	META = await fetchJSON(`${API_BASE}/api/meta`);
};

const absolute = (url: string, base: string) => {
	if (!url) return '';

	if (url.startsWith('http')) return url;

	if (url.startsWith('//')) {
		return 'https:' + url;
	}

	return new URL(url, base).toString();
};

const normalizeStatus = (status: string) => {
	const s = status.toLowerCase();

	if (s.includes('completed') || s.includes('finish') || s.includes('заверш')) {
		return 'completed';
	}

	if (s.includes('hiatus') || s.includes('paused') || s.includes('заморож')) {
		return 'paused';
	}

	if (s.includes('cancel') || s.includes('dropped') || s.includes('брош')) {
		return 'cancelled';
	}

	return 'ongoing';
};

const scrapeManga = async (url: string) => {
	const res = await robustFetch(url);
	const html = await res.text();

	const $ = cheerio.load(html);

	const root = $('section.main div.article_content').first();

	if (!root.length) {
		throw new Error('Cannot find manga root metadata blocks');
	}

	const infoList = root.find('div.detail_info ul');

	const title = $('h1.title-top').first().text().trim() || 'Untitled';

	const coverUrl = absolute(root.find('div.detail_info img').first().attr('src') || '', url);
	const description = infoList.find('#show').first().text().trim() || title;

	let author = 'Unknown';
	let rawStatus = '';
	const rawTags: string[] = [];

	infoList.find('li').each((_, el) => {
		const text = $(el).text();
		const bText = $(el).find('b').text().trim();

		if (bText.includes('Author(s):')) {
			author = text.replace('Author(s):', '').trim();
		}
		if (bText.includes('Status(s):')) {
			rawStatus = text.replace('Status(s):', '').trim();
		}
		if (bText.includes('Genre(s):')) {
			$(el)
				.find('a')
				.each((_, aEl) => {
					rawTags.push($(aEl).text().trim().toLowerCase());
				});
		}
	});

	const chapters: any[] = [];

	root.find('div.chapter_content ul.chapter_list li')
		.toArray()
		.reverse()
		.forEach((el, index) => {
			const a = $(el).find('a').first();
			const href = absolute(a.attr('href') || '', url);

			const nameSpans: string[] = [];
			$(el)
				.find('span')
				.each((_, spanEl) => {
					if (!$(spanEl).attr('class')) {
						nameSpans.push($(spanEl).text().trim());
					}
				});

			const titleName = nameSpans.filter(Boolean).join(' - ').trim() || a.text().trim();

			chapters.push({
				title: titleName,
				url: href,
				number: index + 1,
			});
		});

	return {
		title,
		description,
		coverUrl,
		author,
		rawTags,
		status: normalizeStatus(rawStatus),
		chapters,
	};
};

const fetchPages = async (chapterUrl: string) => {
	const res = await robustFetch(chapterUrl);
	const html = await res.text();

	const $ = cheerio.load(html);

	const pages: string[] = [];

	$('div.page_select select')
		.first()
		.find('option')
		.each((_, el) => {
			const value = $(el).attr('value');

			if (!value || value.endsWith('featured.html')) return;

			pages.push(absolute(value, chapterUrl));
		});

	return [...new Set(pages)];
};

const fetchPageImage = async (pageUrl: string, chapterUrl: string) => {
	const res = await robustFetch(pageUrl);
	const html = await res.text();

	const $ = cheerio.load(html);

	const img = $('#image').attr('src');

	if (!img) {
		throw new Error(`Page image selector target not found: ${pageUrl}`);
	}

	return absolute(img, pageUrl);
};

const run = async () => {
	const [, , url] = process.argv;

	if (!url) {
		throw new Error('Missing URL');
	}

	await loadMeta();

	console.log('Scraping MangaTown...');

	const manga = await scrapeManga(url);

	const langId = META.languages.find((l: any) => l.code === 'en')?.id;

	if (!langId) {
		throw new Error('Could not find language ID in meta');
	}

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
	console.log(manga);
	if (!manga.coverUrl) {
		throw new Error('No cover found');
	}

	const coverBuf = await downloadBuffer(manga.coverUrl, url);

	const coverFile = new File([new Blob([coverBuf])], 'cover.jpg', {
		type: 'image/jpeg',
	});

	console.log('Creating book...');

	const form = new FormData();

	form.append('title', manga.title);
	form.append('titleLang', langId);
	form.append('language', langId);
	form.append('publicationYear', String(new Date().getFullYear()));

	form.append('authorsIds', JSON.stringify([]));
	form.append('authorsNames', JSON.stringify([manga.author]));

	form.append('artistsIds', JSON.stringify([]));
	form.append('artistsNames', JSON.stringify([manga.author]));

	form.append('genres', JSON.stringify(genres));
	form.append('themes', JSON.stringify(themes));

	form.append('titles', JSON.stringify([]));

	form.append(
		'descriptions',
		JSON.stringify([
			{
				language: langId,
				content: manga.description || manga.title,
			},
		]),
	);

	form.append('publicationStatus', JSON.stringify(manga.status));
	form.append('cover', coverFile);

	const res = await robustFetch(`${API_BASE}/api/books`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${API_TOKEN}`,
		},
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
		headers: {
			Authorization: `Bearer ${API_TOKEN}`,
		},
	});

	await robustFetch(`${API_BASE}/api/special/drafts/${bookId}/publish`, {
		method: 'PATCH',
		headers: {
			Authorization: `Bearer ${API_TOKEN}`,
		},
	});

	console.log('Book ID:', bookId);

	for (const ch of manga.chapters) {
		try {
			console.log(`Processing ${ch.title}...`);

			const pages = await fetchPages(ch.url);

			const files: File[] = [];

			for (let i = 0; i < pages.length; i++) {
				const imageUrl = await fetchPageImage(pages[i], ch.url);

				const buf = await downloadBuffer(imageUrl, ch.url);

				files.push(
					new File([new Blob([buf])], `${i}.jpg`, {
						type: 'image/jpeg',
					}),
				);

				await sleep(300);
			}

			const chForm = new FormData();

			chForm.append('number', String(ch.number));
			chForm.append('volume', '0');
			chForm.append('name', ch.title);
			chForm.append('language', langId);

			for (const f of files) {
				chForm.append('pages', f);
			}

			const uploadRes = await robustFetch(`${API_BASE}/api/books/${bookId}/chapter`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${API_TOKEN}`,
				},
				body: chForm,
			});

			if (!uploadRes.ok) {
				throw new Error(`Failed to upload chapter ${ch.number}`);
			}

			console.log(`Successfully Uploaded ${ch.title}`);
			await sleep(500);
		} catch (chErr) {
			console.error(`Error passing chapter ${ch.title}:`, chErr);
		}
	}

	console.log('Scraping process complete.');
};

run().catch((e) => {
	console.error(e);
	process.exit(1);
});
