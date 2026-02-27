const BaseHandler = require('./base');
const { runCommand } = require('../utils');
const chalk = require('chalk');
const glob = require('glob');
const fs = require('fs-extra');
const path = require('node:path');
const os = require('node:os');
const nunjucks = require('nunjucks');

const templatesDir = path.join(__dirname, '../templates');
nunjucks.configure(templatesDir, { autoescape: false });

class NugetHandler extends BaseHandler {
    constructor() {
        super('nuget');
    }

    async preDownload(options) {
        await super.preDownload(options);
        this.sourceName = await this.addTempSource(options.repoUrl, options.username, options.password);
    }

    async addTempSource(repoUrl, username, password) {
        if (!repoUrl) return null;
        const sourceName = `TempSource_${Date.now()}`;
        const sourceArgs = ['sources', 'Add', '-Name', sourceName, '-Source', repoUrl];

        if (username && password) {
            sourceArgs.push('-Username', username, '-Password', password);
        }

        try {
            await runCommand('nuget', sourceArgs);
            return sourceName;
        } catch (error) {
            console.warn(chalk.yellow(`Failed to add temporary source: ${error.message}`));
            return null;
        }
    }

    async createNugetConfig(tmpDir, repoUrl, username, password) {
        const configPath = path.join(tmpDir, 'nuget.config');

        const configXml = nunjucks.render('nuget.config.njk', {
            repoUrl,
            username,
            password
        });

        await fs.writeFile(configPath, configXml);
        return configPath;
    }

    async flattenPackagesAndCleanDir(outDir) {
        console.log(chalk.blue(`Flattening package structure...`));

        const nupkgFiles = glob.sync('**/*.nupkg', { cwd: outDir, absolute: true });

        for (const file of nupkgFiles) {
            const fileName = path.basename(file);
            const destPath = path.join(outDir, fileName);

            if (file !== destPath) {
                await fs.move(file, destPath, { overwrite: true });
            }
        }

        const items = await fs.readdir(outDir);
        for (const item of items) {
            const itemPath = path.join(outDir, item);
            if ((await fs.stat(itemPath)).isDirectory()) {
                await fs.remove(itemPath);
            }
        }
    }

    async executeDownload({ name, version, extraArgs, repoUrl, username, password, outDir, workspace }) {
        const args = ['install'];

        if (workspace) {
            args.push(await this.prepareWorkspace(workspace, 'packages.config'));
        } else {
            args.push(name);

            if (version) {
                args.push('-Version', version);
            }

            if (this.sourceName) {
                args.push('-Source', this.sourceName);
            }
        }

        args.push('-OutputDirectory', outDir, '-DependencyVersion', 'Highest');

        if (repoUrl) {
            const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pkg-deps-nuget-'));
            const configPath = await this.createNugetConfig(tmpDir, repoUrl, username, password);
            args.push('-ConfigFile', configPath);
        }

        args.push(...extraArgs);

        console.log(chalk.blue(`Downloading ${workspace ? 'dependencies from workspace' : name}...`));
        await runCommand('nuget', args);
    }

    async postDownload({ outDir }) {
        if (this.sourceName) {
            await runCommand('nuget', ['sources', 'Remove', '-Name', this.sourceName]).catch(() => { });
            this.sourceName = null;
        }
        await this.flattenPackagesAndCleanDir(outDir);
    }
}

module.exports = new NugetHandler();
