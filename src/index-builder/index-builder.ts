import fs from 'node:fs';
import { parse, resolve } from 'node:path';

import ts from 'typescript';

import { getFiles } from '../filesystem/get-files.js';
import { genToArray } from '../utils/gen-to-array.js';


/**
 * Builds a `targetFile` with exports from imports found in files accepted by the `pathMatchers`.
 */
export const indexBuilder = async (
	targetFile: string,
	pathMatchers: ((path: string) => boolean)[],
	options?: {
		/** @default `@internalexport` */
		exclusionJSDocTag?: string;
	},
) => {
	/* destructured options */
	const { exclusionJSDocTag = '@internalexport' } = options ?? {};

	/* Get the location of where this script is run from */
	const projectRoot = resolve();

	/* Resolve target */
	const pathTarget = resolve(projectRoot, targetFile);

	/* Get the target directory path, for use in creating relative paths */
	const dirTarget = parse(pathTarget).dir;

	/* Retrieve, map, filter and sort the file paths */
	const filePaths = (await genToArray(getFiles(dirTarget, /\.ts/)))
		.map(rawPath => ({ rawPath, path: rawPath.replaceAll('\\', '/') }))
		.filter(({ path }) => pathMatchers.some(fn => fn(path)));

	/* Extract exports from the files through ast parsing. */
	const exports = await Promise.all(filePaths.map(async ({ rawPath, path }) => {
		const content: string = await fs.promises.readFile(rawPath, { encoding: 'utf8' });
		const fileName = path.split('/').at(-1) ?? path;

		const symbols = new Set<string>();
		const types = new Set<string>();

		const sourceFile = ts.createSourceFile(
			fileName,
			content,
			{ languageVersion: ts.ScriptTarget.ES2022 },
			true,
			ts.ScriptKind.TS,
		);
		nodeTraverser(sourceFile, sourceFile, exclusionJSDocTag, symbols, types);

		return {
			path,
			symbols: Array.from(symbols),
			types:   Array.from(types),
		};
	}));

	let lines = exports.reduce((prev, { path, symbols, types }) => {
		if (symbols.length) {
			let line = `export { ${ symbols.join(', ') } } from '${ path.replace('.ts', '.js') }';`;
			prev.push(line.replace(dirTarget.replaceAll('\\', '/'), '.'));
		}
		if (types.length) {
			let line = `export type { ${ types.join(', ') } } from '${ path.replace('.ts', '.js') }';`;
			prev.push(line.replace(dirTarget.replaceAll('\\', '/'), '.'));
		}

		return prev;
	}, [] as string[]);

	/* Check if there is an existing index file, and retrieve the contents */
	fs.mkdirSync(dirTarget, { recursive: true });

	const existingIndex = fs.existsSync(pathTarget)
		? await fs.promises.readFile(pathTarget, { encoding: 'utf8' })
		: '';

	const existingLines = existingIndex.split('\n').filter(l => l.startsWith('export'));

	/* compares two arrays and returns if they have the same entries, does not care about sort */
	const arrayEqualEntries = (a: string[], b: string[]) => {
		const sameNumberOfEntries = a.length === b.length;
		const cacheHasSameEntries = a.every(cache => b.includes(cache));

		return sameNumberOfEntries && cacheHasSameEntries;
	};

	/* only write the index file if it is different from what exists */
	const filesEqual = arrayEqualEntries(lines, existingLines);
	if (!filesEqual) {
		lines.sort((a, b) => {
			let aSort = a.length;
			let bSort = b.length;

			if (a.includes('export type'))
				aSort = aSort + 1000;
			if (b.includes('export type'))
				bSort = bSort + 1000;

			return bSort - aSort;
		});

		console.log('\n', 'create-index: Index updated');

		lines.unshift('/* auto generated */');
		lines.unshift('/* eslint-disable max-len */');
		lines.unshift('/* eslint-disable simple-import-sort/exports */');
		lines.push('');

		/* Write the new index file. */
		await fs.promises.writeFile(pathTarget, lines.join('\n'));
	}
};


const nodeTraverser = (
	source: ts.SourceFile,
	node: ts.Node,
	exclusionTag: string,
	symbols = new Set<string>(),
	types = new Set<string>(),
) => {
	if (node.kind === ts.SyntaxKind.ExportKeyword) {
		// Retrieve the closest comment range to the export.
		const commentRange = ts.getLeadingCommentRanges(
			source.getFullText(),
			node.pos,
		)?.at(-1);

		const commentText = commentRange ? source
			.getFullText()
			.substring(commentRange.pos, commentRange.end)
			.trim() : '';

		const parent = node.parent;
		if (ts.isClassDeclaration(parent)) {
			const name = parent.name?.getText() ?? '';
			if (!commentText.includes(exclusionTag))
				symbols.add(name);
		}
		else if (ts.isFunctionDeclaration(parent)) {
			const name = parent.name?.getText() ?? '';
			if (!commentText.includes(exclusionTag))
				symbols.add(name);
		}
		else if (ts.isVariableStatement(parent)) {
			parent.declarationList.forEachChild(variableDeclaration => {
				if (ts.isVariableDeclaration(variableDeclaration)) {
					const name = variableDeclaration.name.getText() ?? '';
					if (!commentText.includes(exclusionTag))
						symbols.add(name);
				}
			});
		}
		else if (ts.isInterfaceDeclaration(parent)) {
			const name = parent.name.getText();

			const parentsParent = parent.parent;
			if (parentsParent.kind === 311) {
				if (!commentText.includes(exclusionTag))
					types.add(name);
			}
		}
		else if (ts.isTypeAliasDeclaration(parent)) {
			const name = parent.name.getText();

			const parentsParent = parent.parent;
			if (parentsParent.kind === 311) {
				if (!commentText.includes(exclusionTag))
					types.add(name);
			}
		}
		else if (ts.isModuleDeclaration(parent)) {
			const name = parent.name.getText();
			if (!commentText.includes(exclusionTag))
				types.add(name);
		}
		else { /*  */ }
	}

	ts.forEachChild(node, (n)=> nodeTraverser(source, n, exclusionTag, symbols, types));
};
