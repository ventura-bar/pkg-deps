#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const packageJson = require('../package.json');
const { handlePackage } = require('../src/index');

program
  .name('pkg-deps')
  .description('CLI to bundle packages for offline use')
  .version(packageJson.version, '-V, --cli-version', 'output the version number');

const packageTypes = ['npm', 'pip', 'maven', 'nuget', 'docker', 'apk'];

packageTypes.forEach(type => {
  const cmd = program
    .command(type)
    .description(`Bundle ${type} package`)
    .option('-p, --package <name>', 'Package name')
    .option('-w, --workspace [path]', 'Bundle dependencies from a workspace (e.g. package.json). Defaults to current directory.')
    .option('-v, --version <version>', 'Package version')
    .option('-o, --output <path>', 'Output directory')
    .option('-r, --repo <url>', 'Repository URL')
    .option('-u, --username <user>', 'Repository username')
    .option('-P, --password <pass>', 'Repository password');

  cmd
    .argument('[args...]', 'Extra arguments for the package manager')
    .allowUnknownOption()
    .action(async (args, options) => {
      try {
        if (!options.package && !options.workspace) {
          console.error(chalk.red('Error:'), 'You must specify either --package <name> or --workspace [path]');
          process.exit(1);
        }
        if (options.package && options.workspace) {
          console.error(chalk.red('Error:'), 'You cannot specify both --package and --workspace. Pick one.');
          process.exit(1);
        }

        await handlePackage(
          options.package,
          options.version,
          type,
          args,
          options.repo,
          options.username,
          options.password,
          options.output,
          options.workspace
        );
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });
});

program.parse();
