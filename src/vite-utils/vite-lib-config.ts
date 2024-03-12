import { existsSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

import { deepmerge } from 'deepmerge-ts';
import { globby } from 'globby';
import { type ConfigEnv, type UserConfig } from 'vite';


export type ConfigOverrides = UserConfig
| ((env: ConfigEnv) => UserConfig)
| ((env: ConfigEnv) => Promise<UserConfig>)


export interface ConfigOptions {
	entry?: {
		patterns: string[];
	},
	externalImport?: {
		/** Return false to exclude the source from being externalized. */
		filter: (source: string, importer?: string) => boolean
	};
}


export const libConfig = (
	customConfig?: ConfigOverrides,
	options?: ConfigOptions,
) => {
	return async (env: ConfigEnv) => {
		const entryPatterns = options?.entry?.patterns
			?? [ './src/**/!(*.(test|demo|types)).ts' ];

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
				 * Removes the requirement of a index.html file,
				 * instead starts at the entrypoint given in the options.
				 */
				lib: {
					/** We add all files as entrypoints */
					entry:   (await globby(entryPatterns)),
					formats: [ 'es' ],
				},

				rollupOptions: {
					/** By default, we externalize all dependencies.
					 *  a filter can be supplied that excludes certain sources from being externalized */
					external(source, importer, isResolved) {
						// All imports without an importer are internal.
						if (!importer)
							return false;

						// If its already resolved, return true/false if the path exists.
						if (isResolved)
							return !existsSync(source);

						// Exclude from externalization if filter returns false.
						if (!(options?.externalImport?.filter?.(source, importer) ?? true))
							return false;

						const resolved = join(
							resolve(dirname(importer), dirname(source)),
							basename(source, '.js') + '.ts',
						);

						return !existsSync(resolved);
					},

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

		let customCfg: UserConfig | undefined = undefined;

		if (typeof customConfig === 'function')
			customCfg = await customConfig(env);
		else if (customConfig)
			customCfg = customConfig;

		return customCfg ? deepmerge(cfg, customCfg) : cfg;
	};
};
