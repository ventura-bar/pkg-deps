const BaseHandler = require('./base');
const { runCommand, getAuthenticatedUrl } = require('../utils');
const chalk = require('chalk');

class PipHandler extends BaseHandler {
    constructor() {
        super('pip');
    }

    async _download(name, version, extraArgs, repoUrl, username, password, outDir) {
        const packageSpec = version ? `${name}==${version}` : name;
        const args = ['download', '--dest', outDir, packageSpec, ...extraArgs];

        if (repoUrl) {
            const { url, hostname } = getAuthenticatedUrl(repoUrl, username, password);
            args.push('--index-url', url, '--trusted-host', hostname);
        }

        await runCommand('pip', args);
    }
}

module.exports = new PipHandler();
