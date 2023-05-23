import { readdirSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';


export const createEntrypointsFromDirectories = (
	directories: string[],
	filters: ((path: string) => boolean)[] = [],
) => {
	type Entrypoint = {
		path: string;
		packagePath: string;
		packageExport: boolean;
		filters: ((path: string) => boolean)[];
	};
	const entrypoints: Entrypoint[] = [];

	const create = (
		dirpath: string,
	) => {
		const folderPath = join(resolve(), dirpath);
		const dirs = readdirSync(folderPath);

		dirs.forEach(dir => {
			const path = '.' + join(folderPath, dir)
				.replace(resolve(), '')
				.replaceAll(sep, '/') + '/' + 'index.ts';

			const packagePath = './' + path.slice(1)
				.replace(dirpath, '')
				.split('/')
				.filter(Boolean)
				.at(0);

			entrypoints.push({
				path,
				packagePath,
				filters,
				packageExport: true,
			});
		});
	};

	directories.forEach(create);

	return entrypoints;
};
