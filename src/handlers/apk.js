const BaseHandler = require('./base');
const { runCommand, getAuthenticatedUrl } = require('../utils');

class ApkHandler extends BaseHandler {
    constructor() {
        super('apk');
    }

    async _download(name, version, extraArgs, repoUrl, username, password, outDir) {
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
