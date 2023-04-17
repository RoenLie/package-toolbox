import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { build } from 'esbuild';

import { ToolboxConfig } from './define-toolbox.js';


export const buildConfigFile = async (fileName: string) => {
	const result = await build({
		absWorkingDir: process.cwd(),
		entryPoints:   [ fileName ],
		outfile:       'out.js',
		write:         false,
		target:        [ 'node16' ],
		platform:      'node',
		bundle:        false,
		format:        'esm',
		mainFields:    [ 'main' ],
		sourcemap:     'inline',
		metafile:      true,
	});

	const { text } = result.outputFiles[0]!;

	return {
		code:         text,
		dependencies: result.metafile ? Object.keys(result.metafile.inputs) : [],
	};
};


export const loadConfigFromBundledFile = async (
	fileName: string,
	bundledCode: string,
): Promise<{ default: () => Promise<ToolboxConfig>; }> => {
	bundledCode = bundledCode.replaceAll(/import .+?;/gs, '');
	bundledCode = 'const defineToolbox = (config) => config;\n' + bundledCode;

	// for esm, before we can register loaders without requiring users to run node
	// with --experimental-loader themselves, we have to do a hack here:
	// write it to disk, load it with native Node ESM, then delete the file.
	const fileBase = `${ fileName }.timestamp-${ Date.now() }-${ Math.random()
		.toString(16)
		.slice(2) }`;
	const fileNameTmp = `${ fileBase }.mjs`;
	const fileUrl = `${ pathToFileURL(fileBase) }.mjs`;
	await fsp.writeFile(fileNameTmp, bundledCode);
	try {
		return (await import(fileUrl));
	}
	finally {
		fs.unlink(fileNameTmp, () => {}); // Ignore errors
	}
};
