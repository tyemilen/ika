<script setup lang="ts">
import * as fflate from 'fflate';
import { onClickOutside, useScrollLock } from '@vueuse/core';
import type { BooksChapterPostBody } from '~~/shared/schemas';
import { BooksChapterPostBodySchema } from '~~/shared/schemas';

const meta = useMeta();

const { show, bookId } = defineProps<{
	show: boolean;
	bookId: string;
}>();
const emit = defineEmits<{
	close: [];
}>();

const data = ref<Partial<BooksChapterPostBody>>({
	number: undefined,
	volume: undefined,
	name: undefined,
	language: undefined,
	pages: undefined,
});

interface Page {
	filename: string;
	blob: Blob;
	url: string;
}
const pages = ref<Page[]>([]);

const { notify, removeNotification } = useNotifications();

const langIndex = ref(-1);

const onChapterZip = async (event: Event) => {
	const file = (event.target as HTMLInputElement).files?.[0];
	if (!file) return;

	data.value.pages = [];
	pages.value = [];

	const progressNotification = notify({ type: 'progress', text: 'loading', time: -1 });
	const buffer = new Uint8Array(await file.arrayBuffer());

	try {
		const unzipped = fflate.unzipSync(buffer);

		for (const filename in unzipped) {
			if (filename.toLowerCase() == 'comicinfo.xml') {
				const fileData = unzipped[filename]!;
				const decoder = new TextDecoder('utf-8');
				const xmlStr = decoder.decode(fileData);

				const parser = new DOMParser();
				const doc = parser.parseFromString(
					xmlStr.replace(/<\/?([A-Z0-9_-]+)/gi, (match) => match.toLowerCase()),
					'application/xml',
				);

				data.value.volume = Number(doc.querySelector('volume')?.textContent);
				data.value.number = Number(doc.querySelector('number')?.textContent);
				data.value.name = doc.querySelector('title')?.textContent;

				const lang = doc.querySelector('languageiso')?.textContent;

				if (lang) {
					const index = meta.languages.findIndex((x) => x.code == lang);

					if (index == -1) continue;

					langIndex.value = index;
					data.value.language = meta.languages[index]?.id;
				}
			}

			if (!/^.*\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(filename)) continue;

			const fileData = unzipped[filename]!;

			const safeData = new Uint8Array(fileData);
			const blob = new Blob([safeData]);

			const url = URL.createObjectURL(blob);
			pages.value.push({
				filename,
				url,
				blob,
			});
		}
		removeNotification(progressNotification);
		notify({ type: 'success', text: 'Done' });
	} catch (err) {
		removeNotification(progressNotification);

		notify({ type: 'error', text: 'Invalid zip file' });
	}
};
const onChapterDrop = (e: DragEvent) => {
	const files = e.dataTransfer?.files;
	if (files && files.length > 0) {
		onChapterZip({ target: { files: files } } as unknown as Event);
	}
};
const postChapter = () => {
	data.value.pages = pages.value.map(
		(x) =>
			new File([x.blob], x.filename, {
				type: x.blob.type,
				lastModified: Date.now(),
			}),
	);

	const result = BooksChapterPostBodySchema.safeParse(data.value);

	if (!result.success) {
		const { message } = result.error.issues[0]!;
		return notify({ type: 'error', text: `${message}` });
	}

	const formData = new FormData();

	formData.append('number', result.data.number.toString());
	formData.append('volume', result.data.volume.toString());
	formData.append('name', result.data.name);
	formData.append('language', result.data.language);

	result.data.pages.forEach((file) => {
		formData.append('pages', file);
	});

	$fetchNotify(`/api/books/${bookId}/chapter`, {
		method: 'POST',
		body: formData,
	});
};

onMounted(() => {
	const isLocked = useScrollLock(document.body);

	watchEffect(() => (isLocked.value = show));

	const dialog = useTemplateRef<HTMLDivElement>('dialog');
	onClickOutside(dialog, () => emit('close'));
});
</script>
<template>
	<Transition name="modal">
		<div v-show="show" class="modal-container">
			<div class="modal w-full h-full rounded-none!" ref="dialog">
				<div class="modal-titlebar">
					<button class="secondary" @click="emit('close')">
						<span class="pi pi-arrow-left"></span>
					</button>
				</div>
				<div class="flex flex-col gap-2">
					<div class="flex items-center gap-2">
						<input type="checkbox" />
						<p>This is oneshot</p>
					</div>
					<input type="text" placeholder="Name" v-model="data.name" />
					<input type="number" placeholder="Volume number" v-model="data.volume" />
					<input type="number" placeholder="Chapter number" v-model="data.number" />
					<SelectComponent
						:options="meta.languages"
						placeholder="Language"
						v-model="langIndex"
					>
						<template #item="{ option, select }">
							<div
								@click="
									() => {
										select();
										data.language = option.id;
									}
								"
								class="p-2 flex items-center gap-2"
							>
								<span
									:class="['fi', `fi-${$t(`languages.${option.code}.fi-code`)}`]"
								></span>
								<p>{{ $t(`languages.${option.code}.display_name`) }}</p>
							</div>
						</template>
						<template #selected="{ option }">
							<div class="flex items-center gap-2">
								<span
									:class="['fi', `fi-${$t(`languages.${option.code}.fi-code`)}`]"
								></span>
								<p>{{ $t(`languages.${option.code}.display_name`) }}</p>
							</div>
						</template>
					</SelectComponent>
					<div class="w-full h-12">
						<label
							class="flex items-center pl-2 pr-2 justify-between h-12 w-full bg-(--color-primary) cursor-pointer"
							@dragover.prevent
							@dragenter.prevent
							@drop.prevent="onChapterDrop"
						>
							<p>Upload zip</p>
							<input
								type="file"
								class="hidden"
								accept=".zip, .cbz, application/zip, application/x-zip-compressed"
								@change="onChapterZip"
							/>
						</label>
					</div>
				</div>
				<div class="flex gap-2">
					<button class="flex-1" @click="postChapter">Upload</button>
				</div>
				<div class="flex gap-2 flex-wrap justify-center">
					<div class="flex flex-col gap-2 items-center" v-for="(page, index) in pages">
						<p>{{ index + 1 }}</p>
						<div class="cover-xs">
							<img :src="page.url" />
						</div>
					</div>
				</div>
			</div>
		</div>
	</Transition>
</template>
