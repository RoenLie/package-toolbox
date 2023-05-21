/**
 * Executes a shell command and return it as a Promise.
 */
export const exec = async (cmd: string) => {
	const { exec } = await import('node:child_process');

	return new Promise((resolve) => {
		exec(cmd, (error, stdout, stderr) => {
			if (error)
				console.warn(error);

			resolve(stdout ? stdout : stderr);
		});
	});
};
