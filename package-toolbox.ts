import { defineToolbox } from './src/toolbox/define-toolbox.js';


export default defineToolbox(async () => {
	const exclude = (path: string) => [ '.demo', '.test', '.bench' ]
		.every(seg => !path.includes(seg));

	return {
		indexBuilder: {
			entrypoints: [
				{ path: './src/filesystem/index.ts', packagePath: './filesystem' },
				{ path: './src/toolbox/index.ts',    packagePath: './toolbox' },
				{ path: './src/vite/index.ts',       packagePath: './vite' },
			],
			defaultFilters:             [ exclude ],
			defaultPackageExport:       true,
			packageExportNameTransform: (path) => path.replace('./src', './dist'),
		},
		incrementPackage: {
			registry: 'npmjs',
		},
	};
});
