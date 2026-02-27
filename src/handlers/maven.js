const BaseHandler = require('./base');
const fs = require('fs-extra');
const path = require('node:path');
const os = require('node:os');
const chalk = require('chalk');
const nunjucks = require('nunjucks');
const { XMLParser } = require('fast-xml-parser');
const { runCommand, fetchUrl } = require('../utils');

const MAVEN_CENTRAL_URL = 'https://repo1.maven.org/maven2';

// Configure nunjucks
nunjucks.configure(path.join(__dirname, '../templates'), { autoescape: true });

class MavenHandler extends BaseHandler {
  constructor() {
    super('maven');
    this.parser = new XMLParser();
  }

  parsePackageName(name) {
    if (!name.includes(':')) {
      throw new Error('Maven package name must be in format groupId:artifactId');
    }
    const parts = name.split(':');
    return {
      groupId: parts[0],
      artifactId: parts[1],
      type: parts.length > 2 ? parts[2] : null,
      classifier: parts.length > 3 ? parts[3] : null
    };
  }

  async resolveLatestVersion(artifactInfo, repoUrl) {
    const { groupId, artifactId } = artifactInfo;
    const groupPath = groupId.replaceAll('.', '/');
    const baseUrl = repoUrl ? repoUrl.replaceAll(/\/$/, '') : MAVEN_CENTRAL_URL;
    const metadataUrl = `${baseUrl}/${groupPath}/${artifactId}/maven-metadata.xml`;

    console.log(chalk.gray(`Resolving latest version from ${metadataUrl}...`));

    try {
      const xmlData = await fetchUrl(metadataUrl);
      const jsonObj = this.parser.parse(xmlData);
      const latest = jsonObj.metadata?.versioning?.latest || jsonObj.metadata?.versioning?.release;

      if (!latest) {
        throw new Error(`Could not find latest version in metadata for ${groupId}:${artifactId}`);
      }

      console.log(chalk.blue(`Resolved latest version: ${latest}`));

      return latest;
    } catch (error) {
      throw new Error(`Failed to resolve latest version for ${groupId}:${artifactId}: ${error.message}`);
    }
  }

  async createPom(tmpDir, artifactInfo, actualVersion = 'LATEST') {
    const pomContent = nunjucks.render('pom.xml.njk', {
      groupId: artifactInfo.groupId,
      artifactId: artifactInfo.artifactId,
      version: actualVersion,
      type: artifactInfo.type,
      classifier: artifactInfo.classifier
    });

    const pomPath = path.join(tmpDir, 'pom.xml');
    await fs.writeFile(pomPath, pomContent);
    return pomPath;
  }

  async createSettings(tmpDir, repoUrl, username, password) {
    if (!repoUrl && (!username || !password)) {
      return null;
    }

    const settingsContent = nunjucks.render('settings.xml.njk', {
      repoUrl,
      username,
      password
    });

    const settingsPath = path.join(tmpDir, 'settings.xml');
    await fs.writeFile(settingsPath, settingsContent);
    return settingsPath;
  }

  async resolveTarget(name, version, repoUrl, workspace, tmpDir) {
    if (workspace) {
      const pomPath = await this.prepareWorkspace(workspace, 'pom.xml');

      return {
        pomPath,
        downloadTarget: `dependencies from ${pomPath}`,
        artifact: 'workspace'
      };
    }

    const artifactInfo = this.parsePackageName(name);
    const actualVersion = version || (await this.resolveLatestVersion(artifactInfo, repoUrl));
    const artifact = `${name}:${actualVersion}`;
    const pomPath = await this.createPom(tmpDir, artifactInfo, actualVersion);

    return {
      pomPath,
      downloadTarget: `${artifact} and dependencies`,
      artifact
    };
  }

  async executeDownload({ name, version, extraArgs, repoUrl, username, password, outDir, workspace }) {
    const tmpDir = (!workspace || repoUrl) && await fs.mkdtemp(path.join(os.tmpdir(), 'pkg-deps-maven-'));

    try {
      const { pomPath, downloadTarget, artifact } = await this.resolveTarget(
        name,
        version,
        repoUrl,
        workspace,
        tmpDir
      );

      console.log(chalk.blue(`Downloading ${downloadTarget}...`));

      const settingsPath = await this.createSettings(tmpDir, repoUrl, username, password);

      const mvnArgs = [
        'dependency:copy-dependencies',
        `-DoutputDirectory=${outDir}`,
        '-DincludeScope=runtime',
        '-Dmdep.copyPom=true',
        '-f',
        pomPath,
        ...extraArgs
      ];

      if (settingsPath) {
        mvnArgs.push('-s', settingsPath);
      }

      await runCommand('mvn', mvnArgs);

      console.log(chalk.green(`Offline JARs and POMs for ${artifact} are in ${outDir}`));

    } finally {
      if (tmpDir) {
        await fs.remove(tmpDir);
      }
    }
  }
}

module.exports = new MavenHandler();
