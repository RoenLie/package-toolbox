import { defineToolbox } from '@roenlie/package-toolbox/toolbox';


export default defineToolbox(async () => {
	const exclude = (path: string) => [ '.demo', '.test', '.bench' ]
		.every(seg => !path.includes(seg));

	return {
		indexBuilder: {
			entrypoints: [
				{ path: './src/filesystem/index.ts', filters: [ exclude ] },
				{ path: './src/increment-package/index.ts', filters: [ exclude ] },
				{ path: './src/index-builder/index.ts', filters: [ exclude ] },
				{ path: './src/toolbox/index.ts', filters: [ exclude ] },
				{ path: './src/utils/index.ts', filters: [ exclude ] },
				{ path: './src/vite/index.ts', filters: [ exclude ] },
			],
		},
		incrementPackage: {
			registry: 'npmjs',
		},
	};
});
