const { exec } = require('node:child_process');
const util = require('node:util');
const path = require('node:path');
const chalk = require('chalk');
const fs = require('fs-extra');

const execAsync = util.promisify(exec);

const packages = {
    npm: [
        'lodash', 'chalk', 'commander', 'express', 'react',
        'react-dom', 'axios', 'moment', 'uuid', 'tslib',
        'vue', 'angular', 'webpack', 'eslint', 'jest',
        'dotenv', 'cors', 'body-parser', 'fs-extra', 'rxjs'
    ],
    pip: [
        'requests', 'urllib3', 'six', 'botocore', 'certifi',
        'idna', 'python-dateutil', 's3transfer', 'charset-normalizer', 'pydantic',
        'numpy', 'pandas', 'pytest', 'werkzeug', 'flask',
        'boto3', 'jinja2', 'click', 'pyyaml', 'typing-extensions'
    ],
    nuget: [
        'Newtonsoft.Json', 'Dapper', 'Serilog', 'MSTest.TestFramework', 'NUnit',
        'Moq', 'xunit', 'Autofac', 'AutoMapper', 'Polly',
        'FluentValidation', 'NLog', 'RestSharp', 'MediatR', 'Swashbuckle.AspNetCore',
        'Dapper.Contrib', 'Dapper.SqlBuilder', 'Serilog.Sinks.Console', 'Serilog.Sinks.File', 'Microsoft.Extensions.DependencyInjection'
    ],
    maven: [
        'junit:junit', 'org.slf4j:slf4j-api', 'org.projectlombok:lombok', 'com.fasterxml.jackson.core:jackson-databind', 'org.apache.commons:commons-lang3',
        'ch.qos.logback:logback-classic', 'com.google.guava:guava', 'org.springframework.boot:spring-boot-starter-web', 'org.mockito:mockito-core', 'org.springframework:spring-core',
        'org.springframework:spring-context', 'org.apache.httpcomponents:httpclient', 'com.h2database:h2', 'mysql:mysql-connector-java', 'org.hibernate:hibernate-core',
        'commons-io:commons-io', 'org.springframework.boot:spring-boot-starter-test', 'log4j:log4j', 'com.fasterxml.jackson.core:jackson-core', 'com.fasterxml.jackson.core:jackson-annotations'
    ]
};

const cliPath = path.resolve(__dirname, '../bin/index.js');
const testOutDir = path.resolve(__dirname, '../bundles/top-20-tests');

async function runTests() {
    const startMsg = String.raw`\n🚀 Starting Top 20 Packages Bulk Test\n`;
    console.log(chalk.bold.cyan(startMsg));

    await fs.ensureDir(testOutDir);
    let totalSuccess = 0;
    let totalFailed = 0;
    const failures = [];

    for (const [manager, pkgs] of Object.entries(packages)) {
        const sectionMsg = String.raw`\n--- Testing ` + manager.toUpperCase() + String.raw` ---`;
        console.log(chalk.bold.magenta(sectionMsg));

        for (const pkg of pkgs) {
            const outPath = path.join(testOutDir, `${manager}-${pkg.replaceAll(/[:/@]/g, '-')}`);
            console.log(chalk.blue(`Bundling ${manager} package: ${pkg}...`));

            try {
                const cmd = `node ${cliPath} ${manager} --package ${pkg} --output ${outPath}`;
                await execAsync(cmd);

                console.log(chalk.green(`  ✅ ${pkg} successfully bundled!`));
                totalSuccess++;
            } catch (err) {
                const newline = String.raw`\n`;
                console.error(chalk.red(`  ❌ ${pkg} failed to bundle!`));
                console.error(chalk.red(`     Error: ${err.message.split(newline)[0]}`));
                failures.push({ manager, pkg, error: err.message });
                totalFailed++;
            }
        }
    }

    const summaryMsg = String.raw`\n📊 Test Summary:`;
    console.log(chalk.bold.cyan(summaryMsg));
    console.log(chalk.green(`  ✅ Passed: ${totalSuccess}`));
    console.log(chalk.red(`  ❌ Failed: ${totalFailed}`));

    if (totalFailed > 0) {
        const failureMsg = String.raw`\nFailure Details:`;
        console.log(chalk.bold.red(failureMsg));
        const newline = String.raw`\n`;
        failures.forEach(f => {
            console.log(chalk.red(`- [${f.manager}] ${f.pkg}: ${f.error.split(newline)[0]}`));
        });
        process.exit(1);
    } else {
        const successMsg = String.raw`\n🎉 All packages bundled successfully!\n`;
        console.log(chalk.bold.green(successMsg));
    }
}

runTests().catch(err => {
    console.error(chalk.red('Fatal error running tests:', err));
    process.exit(1);
});
