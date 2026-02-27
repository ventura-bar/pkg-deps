# pkg-deps

A CLI tool to download packages and their dependencies for offline / air-gapped environments.

## Supported Package Managers

| Command  | Ecosystem              | Requires        |
|----------|------------------------|-----------------|
| `npm`    | Node.js packages       | `npm`           |
| `pip`    | Python packages        | `pip`           |
| `maven`  | Java/JVM packages      | `mvn`           |
| `nuget`  | .NET packages          | `nuget`         |
| `docker` | Container images       | `docker`        |
| `apk`    | Alpine Linux packages  | `apk` (Alpine)  |

## Installation

```sh
npm install -g pkg-deps
```

## Usage

```
Usage: pkg-deps [options] [command]

CLI to bundle packages for offline use

Options:
  -V, --cli-version           output the version number
  -h, --help                  display help for command

Commands:
  npm [options] [args...]     Bundle Node.js npm package
  pip [options] [args...]     Bundle Python pip package
  maven [options] [args...]   Bundle Java Maven package
  nuget [options] [args...]   Bundle .NET NuGet package
  docker [options] [args...]  Bundle Docker container image
  apk [options] [args...]     Bundle Alpine apk package
  help [command]              display help for command
```

### Per-Command Options

All commands share the same option set:

```
Options:
  -p, --package <name>     Package name
  -w, --workspace [path]   Bundle all dependencies from a workspace manifest file.
                           The path argument defaults to current directory if omitted,
                           but the flag itself is required (use either --package or --workspace).
  -v, --version <version>  Package version (defaults to latest)
  -o, --output <path>      Output directory
  -r, --repo <url>         Repository URL (for private/custom registries)
  -u, --username <user>    Repository username
  -P, --password <pass>    Repository password
  -h, --help               display help for command
```

> Either `--package` or `--workspace` is required — not both.

### Output Directory

Bundles are created in `bundles/<safe-package-name>-<version>-bundle/` by default. Override with `--output`.

---

## Examples

### NPM — single package
```sh
pkg-deps npm --package lodash --version 4.17.21
# → bundles/lodash-4.17.21-bundle/lodash-4.17.21.tgz
```

### NPM — workspace (`package.json`)
```sh
pkg-deps npm --workspace
# or point to a specific directory:
pkg-deps npm --workspace ./my-app
```

### Python (pip) — single package
```sh
pkg-deps pip --package requests --version 2.31.0
# → bundles/requests-2.31.0-bundle/ (whl + tar.gz files)
```

### Python (pip) — workspace (`requirements.txt`)
```sh
pkg-deps pip --workspace
# or:
pkg-deps pip --workspace ./my-app
```

### Java (Maven) — single package
```sh
pkg-deps maven --package org.mockito:mockito-core --version 5.10.0
# → bundles/mockito-core-5.10.0-bundle/ (JARs + POMs)
```

### Java (Maven) — workspace (`pom.xml`)
```sh
pkg-deps maven --workspace
# or:
pkg-deps maven --workspace ./my-app
```

### .NET (NuGet) — single package
```sh
pkg-deps nuget --package Newtonsoft.Json --version 13.0.3
# → bundles/Newtonsoft-Json-13.0.3-bundle/ (.nupkg)
```

### .NET (NuGet) — workspace (`packages.config`)
```sh
pkg-deps nuget --workspace
# or:
pkg-deps nuget --workspace ./my-app
```

### Docker
```sh
pkg-deps docker --package alpine --version latest
# → bundles/alpine-latest-bundle/alpine-latest.tar
```

### Alpine (apk)
```sh
pkg-deps apk --package curl
# → bundles/curl-latest-bundle/
```

### Private / Artifactory Registry
```sh
pkg-deps npm \
  --package @myorg/private-pkg \
  --repo https://registry.myorg.com \
  --username myuser \
  --password mypass
```

### Extra Arguments

Additional arguments are forwarded to the underlying package manager:

```sh
pkg-deps npm --package axios -- --registry=https://registry.npmmirror.com
```
