const chalk = require('chalk');
const { npmHandler,
    pipHandler,
    mavenHandler,
    nugetHandler,
    dockerHandler,
    apkHandler } = require('./handlers');

const handlers = {
    npm: npmHandler,
    pip: pipHandler,
    maven: mavenHandler,
    nuget: nugetHandler,
    docker: dockerHandler,
    apk: apkHandler,
};

async function handlePackage(name, version, type, extraArgs, repoUrl, username, password, outputDir, workspace) {
    const handler = handlers[type.toLowerCase()];

    if (!handler) {
        throw new Error(`Unsupported package type: ${type}. Supported types: ${Object.keys(handlers).join(', ')}`);
    }

    if (workspace) {
        console.log(chalk.blue(`Bundling ${type} workspace dependencies...`));
    } else {
        console.log(chalk.blue(`Bundling ${type} package: ${name}@${version}...`));
    }

    if (extraArgs && extraArgs.length > 0) {
        console.log(chalk.gray(`Extra arguments: ${extraArgs.join(' ')}`));
    }

    if (repoUrl) {
        console.log(chalk.gray(`Using repository: ${repoUrl}`));
    }

    // Pass credentials if provided (only Maven uses them)
    await handler.download({ name, version, repoUrl, username, password, outputDir, workspace, extraArgs });

    if (workspace) {
        console.log(chalk.green(`Successfully bundled ${type} workspace dependencies`));
    } else {
        console.log(chalk.green(`Successfully bundled ${name}@${version}`));
    }
}

module.exports = { handlePackage };
