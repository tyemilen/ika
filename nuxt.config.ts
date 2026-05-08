import tailwindcss from '@tailwindcss/vite';

import { fileURLToPath } from 'node:url';

export default defineNuxtConfig({
	compatibilityDate: '2026-04-21',
	ssr: false,
	devtools: {
		enabled: false,
		vscode: {
			reuseExistingServer: true,
		},
		timeline: {
			enabled: true,
		},
	},
	runtimeConfig: {
		valkeyHost: '',
		valkeyPort: 9999,
		databaseUrl: '',
		meiliHost: '',
		meiliKey: '',
		s3Endpoint: '',
		s3AccessKey: '',
		s3SecretKey: '',
		session: {
			password: process.env.NUXT_SESSION_PASSWORD || '',
			cookie: {
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				httpOnly: true,
			},
		},

		public: {
			coversCdnBase: 'http://is-silly.lan:8333/book-covers',
			avatarsCdnBase: 'http://is-silly.lan:8333/user-avatars',
			bannersCdnBase: 'http://is-silly.lan:8333/user-banners',
			pagesCdnBase: 'http://is-silly.lan:8333/chapter-pages',
			shelfCoversCdnBase: 'http://is-silly:8333/shelf-covers',
		},
	},
	app: {
		head: {
			viewport: 'width=device-width, initial-scale=1, interactive-widget=resizes-content',
		},
	},
	nitro: {
		compatibilityDate: '2026-04-21',
		experimental: {
			websocket: true,
			openAPI: true,
		},
	},
	components: [
		{
			path: '~/components/kit',
			pathPrefix: false,
		},
		{
			path: '~/components',
			pathPrefix: false,
		},
	],
	alias: {
		$: fileURLToPath(new URL('./app/assets/scss', import.meta.url)),
	},
	css: [
		'~/assets/scss/main.scss',
		'~/assets/scss/tailwind.css',
		'primeicons/primeicons.css',
		'flag-icons/css/flag-icons.min.css',
	],
	modules: ['@nuxt/icon', 'nuxt-auth-utils', '@vueuse/nuxt', '@nuxtjs/i18n', '@nuxt/image'],
	i18n: {
		locales: [
			{ code: 'en', language: 'en-US', file: 'en.json' },
			{ code: 'ru', language: 'ru-RU', file: 'ru.json' },
		],
		defaultLocale: 'en',
	},
	vite: {
		plugins: [tailwindcss()],
		css: {
			preprocessorOptions: {
				scss: {
					loadPaths: ['./app/styles'],
				},
			},
		},
		server: {
			allowedHosts: ['is-silly.lan'],
		},
	},
	image: {
		providers: {
			covers: {
				name: 'covers',
				provider: '~/providers/covers.ts',
			},
			avatars: {
				name: 'avatars',
				provider: '~/providers/avatars.ts',
			},
			banners: {
				name: 'banners',
				provider: '~/providers/banners.ts',
			},
			pages: {
				name: 'pages',
				provider: '~/providers/pages.ts',
			},
			shelfCovers: {
				name: 'shelfCovers',
				provider: '~/providers/shelfCovers.ts',
			},
		},
	},
});
