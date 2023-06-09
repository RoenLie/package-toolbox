import { defineToolbox } from './src/toolbox/define-toolbox.js';


export default defineToolbox(async () => {
	const exclude = (path: string) => [ '.demo', '.test', '.bench' ]
		.every(seg => !path.includes(seg));

	return {
		indexBuilder: {
			entrypoints: [
				{ path: './src/filesystem/index.ts', packagePath: './filesystem' },
				{ path: './src/vite/index.ts',       packagePath: './vite' },
			],
			defaultFilters:             [ exclude ],
			defaultPackageExport:       true,
			packageExportNameTransform: (path) => path
				.replace('./src', './dist')
				.replace('.ts', '.js'),
		},
		incrementPackage: {
			registry: 'npmjs',
		},
		exportsBuilder: {
			entries: [
				{
					path:    './toolbox',
					default: './dist/toolbox/define-toolbox.js',
				},
			],
		},
	};
});
