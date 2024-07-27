// creates a python3 project to safely test a python3 environment [27/01/24]

const { rm, mkdir, readdir, cp } = require("node:fs/promises");
const { globSync, existsSync } = require("node:fs");
const path = require(`node:path`);

// This variable is used to define the temporary folder in which we prepare the deployment.
// Override DEPLOY_PREP_FOLDER to install wherever you want.
// Default was ~/deploy/python3/thegame before my rewrite
const DEPLOY_PREP_FOLDER = path.resolve(__dirname, `..`, `to_deploy`);

// Root of the current repository.
const REPO_ROOT = path.resolve(__dirname, "..");

async function main() {
	console.log(`Removing ${DEPLOY_PREP_FOLDER}...`);
	await rm(DEPLOY_PREP_FOLDER, { recursive: true, force: true });

	console.log(`Creating ${DEPLOY_PREP_FOLDER}...`);
	await mkdir(DEPLOY_PREP_FOLDER, { recursive: true });

	console.log(`Copying project files`);
	const IGNORE_LIST = [
		"node_modules",
		"to_deploy",
		"node",
		"scripts",
		"/lib/",
		"origin",
		"electron",
		".vscode",
		".git",
	];

	const files = await readdir(REPO_ROOT);
	const filteredFiles = files.filter((file) => !IGNORE_LIST.includes(file));

	await Promise.all(
		filteredFiles.map((file) =>
			cp(path.resolve(REPO_ROOT, file), path.resolve(DEPLOY_PREP_FOLDER, file), {
				recursive: true,
				filter: (src, dest) => !IGNORE_LIST.some((ignoredFile) => src.includes(ignoredFile)),
			}),
		),
	);
	await mkdir(`${DEPLOY_PREP_FOLDER}/lib`);

	// The following line requires node v22 at least
	const filesToDelete = globSync(`${DEPLOY_PREP_FOLDER}/**/*.pxm`);

	// We remove .pxm files
	await Promise.all(filesToDelete.map((file) => rm(file)));

	// Define an array of file pairs to be copied
	// Each inner array contains [source, destination] paths
	const FILES_TO_COPY = [
		["python3/app.yaml", "app.yaml"],
		["python3/requirements.txt", "requirements.txt"],
		["js/runner_functions.js", "htmls/contents/codes/runner_functions.js"],
		["js/runner_compat.js", "htmls/contents/codes/runner_compat.js"],
		["js/common_functions.js", "htmls/contents/codes/common_functions.js"],
	];

	console.log("Copying files to their proper places for deployment...");
	await Promise.all(
		FILES_TO_COPY.map(([src, dest]) =>
			cp(path.resolve(DEPLOY_PREP_FOLDER, src), path.resolve(DEPLOY_PREP_FOLDER, dest)),
		),
	);

	const secretFile = path.resolve(DEPLOY_PREP_FOLDER, "secrets.py");

	if (!existsSync(secretFile)) {
		console.log("Copying secrets.py to deploy file. Make sure to edit it properly!");
		await cp(path.resolve(DEPLOY_PREP_FOLDER, "useful/template.secrets.py"), secretFile);
	}

	console.log("Everything is done!");
}

main();
