import { deepmerge } from 'deepmerge-ts';
import { globby } from 'globby';
import { type UserConfig } from 'vite';

import { getExternalImportPaths } from '../filesystem/get-import-paths.js';


type _inferred = Parameters<typeof getExternalImportPaths>;
export interface ExtImportOptions {
	from: _inferred['0'],
	options?: _inferred['1']
}


export const libConfig = async (
	customConfig?: UserConfig,
	options?: {
		externalImport: ExtImportOptions;
	},
) => {
	/* find all external dependency paths used. */
	const externalImportPaths = await getExternalImportPaths(
		options?.externalImport?.from ?? './src',
		options?.externalImport?.options,
	);

	const cfg: UserConfig = {
		/** Do not include the public directory in the package output. */
		publicDir: false,

		esbuild: {
			tsconfigRaw: {
				compilerOptions: {
					experimentalDecorators: true,
				},
			},
		},

		build: {
			outDir: 'dist',

			/** Don't empty the out dir, as we create our types first. */
			emptyOutDir: false,

			sourcemap: true,

			/** Indicates that this is a library build.
			 * Removes the requirement of a index.html file, instead starts at the entrypoint given in the options.
			 */
			lib: {
				/** We add all files as entrypoints */
				entry:   (await globby('./src/**/!(*.(test|demo|types)).ts')),
				formats: [ 'es' ],
			},

			rollupOptions: {
				/** By default, we externalize all dependencies.
				 *  There might be a few exceptions to this, with packages that make externalization difficult, or for other reasons. */
				external: externalImportPaths,

				output: {
					/** By preseving modules, we retain the folder structure of the original source, thereby allowing
					 *  generated d.ts files to be correctly picked up. */
					preserveModules: true,

					/** We remove src from any module paths to preserve the folder structure incase any virtual or node_modules
					 *  files are included */
					preserveModulesRoot: 'src',
				},
			},
		},
	};


	return deepmerge(cfg, customConfig ?? {}) as UserConfig;
};
