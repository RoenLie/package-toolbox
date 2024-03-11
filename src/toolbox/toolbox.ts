import { copy } from '../filesystem/copy-files.js';
import { incrementPackageVersion } from '../increment-package/increment-package-version.js';
import { indexBuilder as buildIndex } from '../index-builder/index-builder.js';
import { mergeTSConfig } from '../merge-tsconfig/merge-tsconfig.js';
import { createPackageExports, createTypePath } from '../package-exports/package-exports.js';
import { loadConfigWithTsup } from './config.js';


export const toolbox = async (filePath = './pkg-toolbox.ts') => {
	const config = await loadConfigWithTsup(filePath);

	return {
		incrementPackage: async () => {
			await incrementPackageVersion();
		},

		indexBuilder: async () => {
			if (!config.indexBuilder)
				throw ('No index builder config supplied.');

			const {
				entrypoints,
				exclusionJSDocTag,
				defaultFilters = [],
				defaultPackageExport = false,
				packageExportNameTransform = (path) => path.replace('./src', './dist').replace('.ts', '.js'),
			} = config.indexBuilder;

			const wildExportTransform = (path: string) => packageExportNameTransform(path)
				.replace(/index\..+$/, '*');

			const packageExports: { path: string; default: string; type?: string }[] = [];

			await Promise.all(entrypoints.map((entrypoint) => {
				const { path, filters, packageExport, packagePath, includeWildcard } = entrypoint;

				if (packagePath) {
					if (includeWildcard) {
						packageExports.push({
							path:    packagePath + '/*',
							default: wildExportTransform(path),
						});
					}

					const defPath = packageExportNameTransform(path);
					const exprt = {
						path:    packagePath,
						default: defPath,
						type:    createTypePath(defPath),
					};

					if (packageExport)
						packageExports.push(exprt);
					else if (defaultPackageExport)
						packageExports.push(exprt);
				}

				return buildIndex(
					path,
					[ ...defaultFilters, ...filters ?? [] ],
					{ exclusionJSDocTag },
				);
			}));

			await createPackageExports(packageExports);
		},

		exportsBuilder: async () => {
			if (!config.exportsBuilder)
				throw ('No exports builder config supplied.');

			await createPackageExports(
				config.exportsBuilder.entries,
				config.exportsBuilder.options,
			);
		},

		copy: async (profile: string) => {
			const cfg = config?.copy?.[profile];
			cfg && await copy(cfg);
		},

		mergeTSConfig: (config: string, outFile: string) => {
			mergeTSConfig(config, outFile);
		},
	};
};
