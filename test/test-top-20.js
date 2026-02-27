const { exec } = require('child_process');
const util = require('util');
const path = require('path');
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
    console.log(chalk.bold.cyan('\\n🚀 Starting Top 20 Packages Bulk Test\\n'));

    await fs.ensureDir(testOutDir);
    let totalSuccess = 0;
    let totalFailed = 0;
    const failures = [];

    for (const [manager, pkgs] of Object.entries(packages)) {
        console.log(chalk.bold.magenta(`\\n--- Testing ${manager.toUpperCase()} ---`));

        for (const pkg of pkgs) {
            const outPath = path.join(testOutDir, `${manager}-${pkg.replace(/[:/@]/g, '-')}`);
            console.log(chalk.blue(`Bundling ${manager} package: ${pkg}...`));

            try {
                // To avoid hanging forever on a huge download, wrap with a timeout if needed, but we'll let it rip for now.
                const cmd = `node ${cliPath} ${manager} --package ${pkg} --output ${outPath}`;
                const { stdout, stderr } = await execAsync(cmd);

                // Assert it succeeded
                console.log(chalk.green(`  ✅ ${pkg} successfully bundled!`));
                totalSuccess++;
            } catch (err) {
                console.error(chalk.red(`  ❌ ${pkg} failed to bundle!`));
                console.error(chalk.red(`     Error: ${err.message.split('\\n')[0]}`));
                failures.push({ manager, pkg, error: err.message });
                totalFailed++;
            }
        }
    }

    console.log(chalk.bold.cyan('\\n📊 Test Summary:'));
    console.log(chalk.green(`  ✅ Passed: ${totalSuccess}`));
    console.log(chalk.red(`  ❌ Failed: ${totalFailed}`));

    if (totalFailed > 0) {
        console.log(chalk.bold.red('\\nFailure Details:'));
        failures.forEach(f => {
            console.log(chalk.red(`- [${f.manager}] ${f.pkg}: ${f.error.split('\\n')[0]}`));
        });
        process.exit(1);
    } else {
        console.log(chalk.bold.green('\\n🎉 All packages bundled successfully!\\n'));
    }
}

runTests().catch(err => {
    console.error(chalk.red('Fatal error running tests:', err));
    process.exit(1);
});
