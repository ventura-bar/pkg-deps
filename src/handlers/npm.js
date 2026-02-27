const BaseHandler = require('./base');
const fs = require('fs-extra');
const path = require('node:path');
const os = require('node:os');
const { runCommand } = require('../utils');
const chalk = require('chalk');

class NpmHandler extends BaseHandler {
    constructor() {
        super('npm');
    }

    async executeDownload({ name, version, extraArgs, repoUrl, username, password, outDir, workspace }) {
        const packageName = version ? `${name}@${version}` : name;
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pkg-deps-npm-'));

        try {
            console.log(chalk.blue(
                `Installing ${workspace ? 'dependencies from workspace' : packageName} to temporary directory...`
            ));

            if (workspace) {
                await this.prepareWorkspace(
                    workspace,
                    'package.json',
                    [
                        'package-lock.json',
                        'npm-shrinkwrap.json',
                        '**/package.json'
                    ],
                    tmpDir
                );
            }

            const npmArgs = ['install'];

            if (!workspace) {
                npmArgs.push(packageName);
            }

            npmArgs.push('--ignore-scripts', '--no-bin-links', ...extraArgs);

            if (repoUrl) {
                await this.setupCustomRepo(tmpDir, repoUrl, username, password, npmArgs);
            }

            await runCommand('npm', npmArgs, { cwd: tmpDir });

            await this.packDependencies(tmpDir, outDir, extraArgs);

        } finally {
            await fs.remove(tmpDir);
        }
    }

    async setupCustomRepo(tmpDir, repoUrl, username, password, npmArgs) {
        const npmrcPath = path.join(tmpDir, '.npmrc');
        let npmrcContent = `registry=${repoUrl}\n`;

        if (username && password) {
            const auth = Buffer.from(`${username}:${password}`).toString('base64');
            npmrcContent += `_auth=${auth}\n`;
            npmrcContent += `always-auth=true\n`;
        }

        await fs.writeFile(npmrcPath, npmrcContent);
        npmArgs.push('--userconfig', npmrcPath);
    }

    async packDependencies(tmpDir, outDir, extraArgs) {
        const nodeModulesPath = path.join(tmpDir, 'node_modules');

        if (!(await fs.pathExists(nodeModulesPath))) {
            console.warn(chalk.yellow('No node_modules found. This might be a single package with no dependencies or an error occurred.'));
            return;
        }

        const packages = await fs.readdir(nodeModulesPath);
        console.log(chalk.blue(`Packing dependencies to ${outDir}...`));

        for (const pkg of packages) {
            if (pkg.startsWith('.')) continue;

            const pkgPath = path.join(nodeModulesPath, pkg);
            if ((await fs.stat(pkgPath)).isDirectory()) {
                await this.packPackage(pkg, pkgPath, outDir, extraArgs, tmpDir);
            }
        }
    }

    async packPackage(pkg, pkgPath, outDir, extraArgs, cwd) {
        if (pkg.startsWith('@')) {
            const scopedPackages = await fs.readdir(pkgPath);
            for (const scopedPkg of scopedPackages) {
                const scopedPkgPath = path.join(pkgPath, scopedPkg);
                await runCommand('npm', ['pack', scopedPkgPath, '--pack-destination', outDir, '--ignore-scripts', ...extraArgs], { cwd });
            }
        } else {
            await runCommand('npm', ['pack', pkgPath, '--pack-destination', outDir, '--ignore-scripts', ...extraArgs], { cwd });
        }
    }
}

module.exports = new NpmHandler();
