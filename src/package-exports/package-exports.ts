import { readFileSync, writeFileSync } from 'node:fs';

export type ExportEntry = {
	path: string;
	default: string;
	types?: string;
	import?: string;
	node?: string;
	require?: string;
}


export const createPackageExports = async (
	entries: ExportEntry[],
	options?: {
		override?: boolean
	},
) => {
	const packageJson = readFileSync('./package.json', { encoding: 'utf8' });
	const parsedPackage = JSON.parse(packageJson);

	const exports: Record<string, Partial<ExportEntry>> = options?.override
		? {} : (parsedPackage['exports'] ?? {});

	for (const entry of entries) {
		const target = exports[entry.path] ??= {};

		if (!entry.types)
			entry.types = createTypePath(entry.import ?? entry.default);

		target['types'] = entry.types ?? '';
		target['default'] = entry.default;
		entry.node && (target['node'] = entry.node);
		entry.import && (target['import'] = entry.import);
		entry.require && (target['require'] = entry.require);
	}

	parsedPackage['exports'] = exports;
	const stringified = JSON.stringify(parsedPackage, null, '\t');

	writeFileSync('./package.json', stringified);
};


export const createTypePath = (path: string) => {
	const split = path.split('/');
	const filesplit = split.at(-1)!.split('.');
	filesplit[filesplit.length - 1] = 'd.ts';
	split[split.length - 1] = filesplit.join('.');

	return split.join('/');
};
