const BaseHandler = require('./base');
const { runCommand, getAuthenticatedUrl } = require('../utils');
const chalk = require('chalk');

class PipHandler extends BaseHandler {
    constructor() {
        super('pip');
    }

    async executeDownload({ name, version, extraArgs, repoUrl, username, password, outDir, workspace }) {
        const packageName = version ? `${name}==${version}` : name;

        const args = ['download', '--dest', outDir];

        if (workspace) {
            args.push('-r', await this.prepareWorkspace(workspace, 'requirements.txt'));
        } else {
            args.push(packageName);
        }

        args.push(...extraArgs);

        console.log(chalk.blue(`Downloading ${workspace ? 'dependencies from workspace' : packageName}...`));

        if (repoUrl) {
            const { url, hostname } = getAuthenticatedUrl(repoUrl, username, password);
            args.push('--index-url', url, '--trusted-host', hostname);
        }

        await runCommand('pip', args);
    }
}

module.exports = new PipHandler();
