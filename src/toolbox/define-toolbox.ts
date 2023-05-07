import { copy, CopyOptions } from '../filesystem/copy-files.js';
import { incrementPackageVersion } from '../increment-package/increment-package-version.js';
import { indexBuilder as buildIndex } from '../index-builder/index-builder.js';
import { buildConfigFile, loadConfigFromBundledFile } from './config.js';


export type ToolboxConfig = {
	incrementPackage?: {
		registry: 'npmjs'
	};
	indexBuilder?: {
		entrypoints: {
			path: string;
			filters: ((path: string) => boolean)[]
		}[];
		exclusionJSDocTag?: string;
	};
	copy?: Record<string, CopyOptions>;
}


export const defineToolbox = async (
	config: () => (ToolboxConfig | Promise<ToolboxConfig>),
) => config;


export const toolbox = async () => {
	const fileName = './package-toolbox.js';

	const output = await buildConfigFile(fileName);
	const mod = await loadConfigFromBundledFile(
		fileName,
		output.code,
	);

	const config = await mod.default();

	return {
		incrementPackage: async () => {
			await incrementPackageVersion();
		},
		indexBuilder: async () => {
			if (!config.indexBuilder)
				throw ('No index builder config supplied.');

			const { entrypoints, exclusionJSDocTag } = config.indexBuilder;

			await Promise.all(entrypoints.map(({ path, filters }) => {
				return buildIndex(path, filters, { exclusionJSDocTag });
			}));
		},
		copy: async (profile: string) => {
			const cfg = config?.copy?.[profile];
			cfg && await copy(cfg);
		},
	};
};
