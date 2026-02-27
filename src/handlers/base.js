const fs = require('fs-extra');
const path = require('node:path');
const chalk = require('chalk');
const { glob } = require('glob');

const DEFAULT_IGNORE_PATTERNS = ['node_modules/**', 'bundles/**', 'dist/**', 'build/**', '.git/**'];

class BaseHandler {
    constructor(type) {
        this.type = type;
        this.requiresTempDirectory = false;
        this.tmpDir = null;
    }

    async download(options) {
        const actualName = options.name || (options.workspace ? 'workspace' : 'unknown');
        const actualVersion = options.version || 'latest';
        const safeName = actualName.replaceAll(/[^\w-@/]/g, '-').replaceAll(/(^-+)|(-+$)/g, '');

        const defaultDir = path.join('bundles', `${safeName}-${actualVersion}-bundle`);
        const outDir = options.outputDir ? path.resolve(options.outputDir) : path.resolve(defaultDir);

        const resolvedOptions = {
            ...options,
            name: actualName,
            version: actualVersion,
            outDir,
            extraArgs: options.extraArgs || []
        };

        let success = false;

        try {
            await this.preDownload(resolvedOptions);

            if (resolvedOptions.workspace) {
                console.log(chalk.blue(`[${this.type}] processing workspace...`));
            } else {
                console.log(chalk.blue(`[${this.type}] processing ${actualName}@${actualVersion}...`));
            }

            // Execute specific logic
            await this.executeDownload(resolvedOptions);

            success = true;
            console.log(chalk.green(`[${this.type}] bundle ready in ${outDir}`));

        } catch (error) {
            console.error(chalk.red(`[${this.type}] failed: ${error.message}`));
            throw error;
        } finally {
            await this.postDownload({ ...resolvedOptions, success });
        }
    }

    async preDownload(options) {
        // Default cleanup
        await fs.remove(options.outDir);
        await fs.ensureDir(options.outDir);

        if (this.requiresTempDirectory) {
            this.tmpDir = await fs.mkdtemp(path.join(require('node:os').tmpdir(), `pkg-deps-${this.type}-`));
        }
    }

    async prepareWorkspace(workspace, mainFile, optionalFiles = [], tmpDir = null) {
        const initialWorkspaceDir = typeof workspace === 'string' ? path.resolve(workspace) : process.cwd();
        const stat = await fs.pathExists(initialWorkspaceDir) ? await fs.stat(initialWorkspaceDir) : null;
        const isFile = stat?.isFile();

        const mainFilePath = isFile ? initialWorkspaceDir : path.join(initialWorkspaceDir, mainFile);
        const resolvedWorkspaceDir = isFile ? path.dirname(mainFilePath) : initialWorkspaceDir;
        const resolvedMainFile = isFile ? path.basename(mainFilePath) : mainFile;

        if (!isFile && !(await fs.pathExists(mainFilePath))) {
            throw new Error(`${resolvedMainFile} not found in workspace: ${resolvedWorkspaceDir}`);
        }

        if (tmpDir) {
            await fs.copy(mainFilePath, path.join(tmpDir, resolvedMainFile));
            await this.copyOptionalFiles(resolvedWorkspaceDir, optionalFiles, tmpDir);
        }

        return mainFilePath;
    }

    async copyOptionalFiles(resolvedWorkspaceDir, optionalFiles, tmpDir) {
        for (const pattern of optionalFiles) {
            const matches = pattern.includes('*')
                ? await glob(pattern, { cwd: resolvedWorkspaceDir, ignore: DEFAULT_IGNORE_PATTERNS })
                : [pattern];

            for (const match of matches) {
                const src = path.join(resolvedWorkspaceDir, match);

                if ((await fs.pathExists(src)) && (await fs.stat(src)).isFile()) {
                    const dest = path.join(tmpDir, match);
                    await fs.ensureDir(path.dirname(dest));
                    await fs.copy(src, dest);
                }
            }
        }
    }

    async executeDownload(options) {
        throw new Error('executeDownload must be implemented by subclass');
    }

    async postDownload(options) {
        if (this.tmpDir) {
            await fs.remove(this.tmpDir);
            this.tmpDir = null;
        }
    }
}

module.exports = BaseHandler;
