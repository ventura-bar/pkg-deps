const BaseHandler = require('./base');
const { runCommand, getAuthenticatedUrl } = require('../utils');
const chalk = require('chalk');

class ApkHandler extends BaseHandler {
    constructor() {
        super('apk');
    }

    async executeDownload(options) {
        const { name, version, extraArgs, repoUrl, username, password, outDir, workspace } = options;
        if (workspace) {
            console.warn(chalk.yellow('[apk] Workspace bundling is not supported for apk packages. Treating as single package.'));
        }

        const packageSpec = version ? `${name}=${version}` : name;
        const args = ['fetch', '-o', outDir, '-R'];

        if (repoUrl) {
            const { url: authUrl } = getAuthenticatedUrl(repoUrl, username, password);
            args.push('--repository', authUrl);
        }

        args.push(packageSpec, ...extraArgs);
        await runCommand('apk', args);
    }
}

module.exports = new ApkHandler();
