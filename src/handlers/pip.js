const BaseHandler = require('./base');
const { runCommand } = require('../utils');
const chalk = require('chalk');

class PipHandler extends BaseHandler {
    constructor() {
        super('pip');
    }

    async _download(name, version, extraArgs, repoUrl, username, password, outDir) {
        const packageSpec = version ? `${name}==${version}` : name;
        const args = ['download', '--dest', outDir, packageSpec, ...extraArgs];

        if (repoUrl) {
            let authUrl = repoUrl;
            if (username && password) {
                try {
                    const url = new URL(repoUrl);
                    url.username = username;
                    url.password = password;
                    authUrl = url.toString();
                } catch (e) {
                    console.warn(chalk.yellow('Invalid repository URL provided, ignoring credentials injection.'));
                }
            }
            args.push('--index-url', authUrl);
            args.push('--trusted-host', new URL(repoUrl).hostname);
        }

        await runCommand('pip', args);
    }
}

module.exports = { download: (n, v, e, r, u, p, o) => new PipHandler().download(n, v, e, r, u, p, o) };
