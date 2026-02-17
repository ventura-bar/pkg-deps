const BaseHandler = require('./base');
const { runCommand } = require('../utils');
const chalk = require('chalk');
const glob = require('glob');
const fs = require('fs-extra');
const path = require('node:path');

class NugetHandler extends BaseHandler {
    constructor() {
        super('nuget');
    }

    async _download(name, version, extraArgs, repoUrl, username, password, outDir) {
        let sourceName = null;

        try {
            // Handle Custom Repo / Auth
            if (repoUrl) {
                sourceName = `TempSource_${Date.now()}`;
                const sourceArgs = ['sources', 'Add', '-Name', sourceName, '-Source', repoUrl];
                if (username && password) {
                    sourceArgs.push('-Username', username, '-Password', password);
                }
                try {
                    await runCommand('nuget', sourceArgs);
                } catch (error) {
                    console.warn(chalk.yellow(`Failed to add temporary source: ${error.message}`));
                    sourceName = null;
                }
            }

            // nuget install <package> -Version <version> -OutputDirectory <outDir> -DependencyVersion Highest
            const args = [
                'install',
                name,
                '-OutputDirectory', outDir,
                '-DependencyVersion', 'Highest'
            ];

            if (version) {
                args.push('-Version', version);
            }

            if (sourceName) {
                args.push('-Source', sourceName);
            }

            args.push(...extraArgs);

            await runCommand('nuget', args);

            // Flattening Logic
            console.log(chalk.blue(`Flattening package structure...`));

            const nupkgFiles = glob.sync('**/*.nupkg', { cwd: outDir, absolute: true });

            for (const file of nupkgFiles) {
                const fileName = path.basename(file);
                const destPath = path.join(outDir, fileName);

                if (file !== destPath) {
                    await fs.move(file, destPath, { overwrite: true });
                }
            }

            // Clean up subdirectories
            const items = await fs.readdir(outDir);
            for (const item of items) {
                const itemPath = path.join(outDir, item);
                const stat = await fs.stat(itemPath);
                if (stat.isDirectory()) {
                    await fs.remove(itemPath);
                }
            }

        } finally {
            if (sourceName) {
                await runCommand('nuget', ['sources', 'Remove', '-Name', sourceName]).catch(() => { });
            }
        }
    }
}

module.exports = new NugetHandler();
