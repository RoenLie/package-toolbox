import { copy } from '../filesystem/copy-files.js';
import { incrementPackageVersion } from '../increment-package/increment-package-version.js';
import { indexBuilder as buildIndex } from '../index-builder/index-builder.js';
import { createPackageExports, createTypePath, ExportEntry } from '../package-exports/package-exports.js';
import { loadConfigWithTsup } from './config.js';


export const toolbox = async () => {
	const filePath = './package-toolbox.js';
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
				packageExportNameTransform = (path) => path.replace('./src', './dist'),
			} = config.indexBuilder;

			const packageExports: { path: string; default: string; }[] = [];

			await Promise.all(entrypoints.map((entrypoint) => {
				const { path, filters, packageExport, packagePath } = entrypoint;

				if (packagePath) {
					const exprt = {
						path:    packagePath,
						default: packageExportNameTransform(path),
					};

					if (packageExport !== undefined && packageExport)
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

			const packageExportEntries = packageExports.map(entry => ({
				path:    entry.path,
				default: entry.default,
				types:   createTypePath(entry.default),
			} satisfies ExportEntry));

			await createPackageExports(packageExportEntries);
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
	};
};
