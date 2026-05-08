export interface MetaResponseEntry {
	id: string;
	name: string;
}

export interface MetaResponse {
	genres: MetaResponseEntry[];
	themes: MetaResponseEntry[];
	languages: {
		id: string;
		code: string;
	}[];
}
