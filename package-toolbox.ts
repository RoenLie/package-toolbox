import { defineToolbox } from '@roenlie/package-toolbox/toolbox';


export default defineToolbox(async () => {
	const exclude = (path: string) => [ '.demo', '.test', '.bench' ]
		.every(seg => !path.includes(seg));

	return {
		indexBuilder: {
			entrypoints: [
				{ path: './src/filesystem/index.ts',        filters: [ exclude ] },
				{ path: './src/toolbox/index.ts',           filters: [ exclude ] },
				{ path: './src/vite/index.ts',              filters: [ exclude ] },
			],
		},
		exportsBuilder: {
			entries: [
				{ path: '.',            default: './dist/lib/index.js' },
				{ path: './filesystem', default: './dist/filesystem/index.js' },
				{ path: './toolbox',    default: './dist/toolbox/index.js' },
				{ path: './vite',       default: './dist/vite/index.js' },
			],
			options: {
				override: true,
			},
		},
		incrementPackage: {
			registry: 'npmjs',
		},
	};
});
