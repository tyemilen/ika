<script lang="ts" setup>
const showCreateShelf = ref(false);

const { data: shelves } = useLazyFetch('/api/library');

const { user } = useUser();
</script>
<template>
	<div class="flex flex-col gap-4 w-full relative centered pb-5">
		<h2>Your cool ass shelves</h2>
		<div class="flex flex-row flex-wrap gap-4">
			<div class="flex gap-4 w-full" v-for="shelf in shelves">
				<NuxtLink :to="`/profile/${user?.username}/shelves/${shelf.id}`">
					<ShelfCoverComponent
						v-if="user"
						class="cover-md"
						:user-id="user.id"
						:id="shelf.id"
						:type="shelf.type"
					/>
				</NuxtLink>

				<div class="flex w-full h-fit justify-between break-all">
					<p>
						{{ shelf.name }}
					</p>

					<MenuComponent :name="`shelf-actions-${shelf.id}`" :stretch="false">
						<template #activator>
							<div
								class="relative w-6 h-6 p-4 flex justify-center rounded-full items-center"
							>
								<span class="pi pi-ellipsis-v"></span>
							</div>
						</template>
						<template #list>
							<p>Edit</p>
							<p>Share</p>
							<p class="text-red-500" v-if="shelf.type == 'user'">Delete</p>
						</template>
					</MenuComponent>
				</div>
			</div>
		</div>
		<button
			@click="showCreateShelf = true"
			class="w-12 h-12 tertiary flex justify-center items-center fixed bottom-16 right-2"
		>
			<span class="pi pi-plus"></span>
		</button>
	</div>

	<Teleport to="body">
		<CreateShelfModal :show="showCreateShelf" @close="showCreateShelf = false" />
	</Teleport>
</template>
