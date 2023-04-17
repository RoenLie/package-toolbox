#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { toolbox } from '../dist/toolbox/define-toolbox.js';


const cmds = await toolbox();

yargs(hideBin(process.argv))
	.command('increment-version', 'increment the package.json version.', () => { /*  */ }, async () => {
		await cmds.incrementPackage();
	})
	.command('build-indexes', 'build indexes at configured locations.', () => { /*  */ }, async () => {
		cmds.indexBuilder();
	})
	.demandCommand(1)
	.parse();
