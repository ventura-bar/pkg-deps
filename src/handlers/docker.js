const BaseHandler = require('./base');
const { runCommand } = require('../utils');
const chalk = require('chalk');
const path = require('node:path');
const fs = require('fs-extra');

class DockerHandler extends BaseHandler {
    constructor() {
        super('docker');
    }

    async _download(name, version, extraArgs, repoUrl, username, password, outDir) {
        const actualVersion = version || 'latest';
        const image = `${name}:${actualVersion}`;
        const outputName = `${name.replaceAll(/[^\w-]/g, '-')}-${actualVersion}`;

        let fullImageName = image;
        let registryHost = '';

        if (repoUrl) {
            registryHost = repoUrl.replaceAll(/^https?:\/\//, '');
            if (!image.startsWith(registryHost + '/') && !name.startsWith(registryHost + '/')) {
                fullImageName = `${registryHost}/${image}`;
            }

            if (username && password) {
                console.log(chalk.blue(`Logging in to ${registryHost}...`));
                await runCommand('docker', ['login', registryHost, '-u', username, '-p', password]);
            }
        }

        try {
            console.log(chalk.blue(`Pulling Docker image ${fullImageName}...`));
            await runCommand('docker', ['pull', fullImageName, ...extraArgs]);

            console.log(chalk.blue(`Saving Docker image to ${outDir}/${outputName}.tar...`));
            // BaseHandler ensures dir exists, but let's be safe if logic changes? No, BaseHandler guarantees it.
            await runCommand('docker', ['save', '-o', path.join(outDir, `${outputName}.tar`), fullImageName]);

        } finally {
            if (repoUrl && username && password) {
                await runCommand('docker', ['logout', registryHost]).catch((err) => {
                    console.warn(chalk.yellow(`Warning: Docker logout failed for ${registryHost}. Error: ${err.message}`));
                });
            }
        }
    }
}

module.exports = new DockerHandler();
