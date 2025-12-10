const BaseHandler = require('./base');
const { runCommand } = require('../utils');

class ApkHandler extends BaseHandler {
    constructor() {
        super('apk');
    }

    async _download(name, version, extraArgs, repoUrl, username, password, outDir) {
        const packageSpec = version ? `${name}=${version}` : name;
        const args = ['fetch', '-o', outDir, '-R'];

        if (repoUrl) {
            args.push('--repository', repoUrl);
            if (username && password && !repoUrl.includes('@')) {
                try {
                    const url = new URL(repoUrl);
                    url.username = username;
                    url.password = password;
                    args[args.indexOf(repoUrl)] = url.toString();
                } catch (e) {
                    // ignore
                }
            }
        }

        args.push(packageSpec, ...extraArgs);
        await runCommand('apk', args);
    }
}

module.exports = { download: (n, v, e, r, u, p, o) => new ApkHandler().download(n, v, e, r, u, p, o) };
