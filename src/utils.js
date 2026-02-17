const execa = require('execa');
const chalk = require('chalk');

async function runCommand(command, args, options = {}) {
    console.log(chalk.gray(`> ${command} ${args.join(' ')}`));
    try {
        const { stdout } = await execa(command, args, {
            stdio: 'inherit',
            ...options,
        });
        return stdout;
    } catch (error) {
        throw new Error(`Command failed: ${command} ${args.join(' ')}\n${error.message}`);
    }
}

async function fetchUrl(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} from ${url}`);
    }

    return response.text();
}

function getAuthenticatedUrl(repoUrl, username, password) {
    if (!repoUrl) {
        return { url: '', hostname: '' };
    }

    try {
        const url = new URL(repoUrl);
        if (username && password) {
            url.username = username;
            url.password = password;
        }
        return { url: url.toString(), hostname: url.hostname };
    } catch (e) {
        throw new Error(`Invalid repository URL: "${repoUrl}"`);
    }
}

module.exports = { runCommand, fetchUrl, getAuthenticatedUrl };
