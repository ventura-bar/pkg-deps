const fs = require('fs-extra');
const path = require('node:path');
const chalk = require('chalk');

class BaseHandler {
    constructor(type) {
        this.type = type;
    }

    async download(name, version, extraArgs = [], repoUrl, username, password, outputDir) {
        const actualVersion = version || 'latest';
        const safeName = name.replaceAll(/[^\w-@\/]/g, '-').replaceAll(/^-+|-+$/g, '');

        // Standardize output directory
        const defaultFolderName = `${safeName}-${actualVersion}-bundle`;
        const defaultDir = path.join('bundles', defaultFolderName);
        const outDir = outputDir ? path.resolve(outputDir) : path.resolve(defaultDir);

        try {
            // Setup
            await this.preDownload(outDir, name, version);

            console.log(chalk.blue(`[${this.type}] processing ${name}@${actualVersion}...`));

            // Execute specific logic
            await this._download(name, version, extraArgs, repoUrl, username, password, outDir);

            // Cleanup/Verify
            await this.postDownload(outDir, name, version);

            console.log(chalk.green(`[${this.type}] bundle ready in ${outDir}`));

        } catch (error) {
            console.error(chalk.red(`[${this.type}] failed: ${error.message}`));
            throw error;
        }
    }

    async preDownload(outDir, name, version) {
        // Default cleanup
        await fs.remove(outDir);
        await fs.ensureDir(outDir);
    }

    async postDownload(outDir, name, version) {
        // Hook for any post-processing
    }

    async _download(name, version, extraArgs, repoUrl, username, password, outDir) {
        throw new Error('_download must be implemented by subclass');
    }
}

module.exports = BaseHandler;
