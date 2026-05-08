import { createOperationsGenerator, defineProvider } from '@nuxt/image/runtime';
import { joinURL } from 'ufo';

const operationsGenerator = createOperationsGenerator()

export default defineProvider({
	getImage(src, { modifiers = {} }) {
		const config = useRuntimeConfig();
		const operations = operationsGenerator(modifiers)

		return {
			url: joinURL(config.public.coversCdnBase, src + (operations ? '?' + operations : ''))
		};
	},
});
