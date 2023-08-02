import { defineToolbox } from './dist/toolbox/define-toolbox.js';


export default defineToolbox(async () => {
	const exclude = (path: string) => [ '.demo', '.test', '.bench' ]
		.every(seg => !path.includes(seg));

	return {
		indexBuilder: {
			entrypoints: [
				{
					path:            './src/vite/index.ts',
					packagePath:     './vite',
					includeWildcard: true,
				},
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
				{
					path:     './filesystem/*',
					default:  './dist/filesystem/*',
					wildcard: true,
				},
			],
		},
	};
});
