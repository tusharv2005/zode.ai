#!/usr/bin/env bun
import { $ } from "bun"
import pkg from "../package.json"
import { Script } from "@opencode-ai/script"
import { fileURLToPath } from "url"

const dir = fileURLToPath(new URL("..", import.meta.url))
process.chdir(dir)

async function published(name: string, version: string) {
  return (await $`npm view ${name}@${version} version`.nothrow()).exitCode === 0
}

async function publish(dir: string, name: string, version: string) {
  // GitHub artifact downloads can drop the executable bit, and Docker uses the
  // unpacked dist binaries directly rather than the published tarball.
  if (process.platform !== "win32") await $`chmod -R 755 .`.cwd(dir)
  if (await published(name, version)) {
    console.log(`already published ${name}@${version}`)
    return
  }
  await $`bun pm pack`.cwd(dir)
  await $`npm publish *.tgz --access public --tag ${Script.channel} --provenance`.cwd(dir) // zodecode_change
}

const binaries: Record<string, string> = {}
// zodecode_change start
for (const filepath of new Bun.Glob("*/*/package.json").scanSync({ cwd: "./dist" })) {
  // zodecode_change end
  const pkg = await Bun.file(`./dist/${filepath}`).json()
  binaries[pkg.name] = pkg.version
}
console.log("binaries", binaries)
const version = Object.values(binaries)[0]

await $`mkdir -p ./dist/${pkg.name}`
await $`cp -r ./bin ./dist/${pkg.name}/bin`
await $`cp ./script/postinstall.mjs ./dist/${pkg.name}/postinstall.mjs`
await Bun.file(`./dist/${pkg.name}/LICENSE`).write(await Bun.file("../../LICENSE").text())
await Bun.file(`./dist/${pkg.name}/README.md`).write(await Bun.file("./README.md").text()) // zodecode_change

await Bun.file(`./dist/${pkg.name}/package.json`).write(
  JSON.stringify(
    {
      name: pkg.name, // zodecode_change
      bin: {
        // zodecode_change start
        zode: `./bin/zode`,
        zodecode: `./bin/zode`,
        // zodecode_change end
      },
      scripts: {
        postinstall: "bun ./postinstall.mjs || node ./postinstall.mjs",
      },
      version: version,
      license: pkg.license,
      keywords: pkg.keywords, // zodecode_change
      private: pkg.private, // zodecode_change
      optionalDependencies: binaries,
      // zodecode_change start
      repository: {
        type: "git",
        url: "https://github.com/Zode-Org/zodecode",
      },
      // zodecode_change end
    },
    null,
    2,
  ),
)

const tasks = Object.entries(binaries).map(async ([name]) => {
  await publish(`./dist/${name}`, name, binaries[name])
})
await Promise.all(tasks)
await publish(`./dist/${pkg.name}`, pkg.name, version) // zodecode_change

const image = "ghcr.io/zode-org/zodecode" // zodecode_change
const platforms = "linux/amd64,linux/arm64"
const tags = [`${image}:${version}`, `${image}:${Script.channel}`]
const tagFlags = tags.flatMap((t) => ["-t", t])

// registries
if (!Script.preview) {
  await $`docker buildx build --platform ${platforms} ${tagFlags} --push .`
  // Calculate SHA values
  const arm64Sha = await $`sha256sum ./dist/zode-linux-arm64.tar.gz | cut -d' ' -f1`.text().then((x) => x.trim())
  const x64Sha = await $`sha256sum ./dist/zode-linux-x64.tar.gz | cut -d' ' -f1`.text().then((x) => x.trim())
  const macX64Sha = await $`sha256sum ./dist/zode-darwin-x64.zip | cut -d' ' -f1`.text().then((x) => x.trim())
  const macArm64Sha = await $`sha256sum ./dist/zode-darwin-arm64.zip | cut -d' ' -f1`.text().then((x) => x.trim())

  const [pkgver, _subver = ""] = Script.version.split(/(-.*)/, 2)

  // arch
  const binaryPkgbuild = [
    "# Maintainer: zode", // zodecode_change
    "",
    "pkgname='zode-bin'",
    `pkgver=${pkgver}`,
    `_subver=${_subver}`,
    "options=('!debug' '!strip')",
    "pkgrel=1",
    "pkgdesc='The AI coding agent built for the terminal.'",
    "url='https://github.com/Zode-Org/zodecode'",
    "arch=('aarch64' 'x86_64')",
    "license=('MIT')",
    "provides=('zode')",
    "conflicts=('zode')",
    "depends=('ripgrep')",
    "",
    `source_aarch64=("\${pkgname}_\${pkgver}_aarch64.tar.gz::https://github.com/Zode-Org/zodecode/releases/download/v\${pkgver}\${_subver}/zode-linux-arm64.tar.gz")`,
    `sha256sums_aarch64=('${arm64Sha}')`,

    `source_x86_64=("\${pkgname}_\${pkgver}_x86_64.tar.gz::https://github.com/Zode-Org/zodecode/releases/download/v\${pkgver}\${_subver}/zode-linux-x64.tar.gz")`,
    `sha256sums_x86_64=('${x64Sha}')`,
    "",
    "package() {",
    '  install -Dm755 ./zode "${pkgdir}/usr/lib/zode/zode"', // zodecode_change
    '  install -dm755 "${pkgdir}/usr/bin" "${pkgdir}/usr/lib/zode/tree-sitter"', // zodecode_change
    '  cp -r ./tree-sitter/. "${pkgdir}/usr/lib/zode/tree-sitter/"', // zodecode_change
    "  printf '%s\\n' '#!/bin/sh' 'export ZODE_TREE_SITTER_WASM_DIR=/usr/lib/zode/tree-sitter' 'exec /usr/lib/zode/zode \"$@\"' > \"${pkgdir}/usr/bin/zode\"", // zodecode_change
    '  chmod 755 "${pkgdir}/usr/bin/zode"', // zodecode_change
    "}",
    "",
  ].join("\n")

  for (const [pkg, pkgbuild] of [["zode-bin", binaryPkgbuild]]) {
    for (let i = 0; i < 30; i++) {
      try {
        await $`rm -rf ./dist/aur-${pkg}`
        await $`git clone ssh://aur@aur.archlinux.org/${pkg}.git ./dist/aur-${pkg}`
        await $`cd ./dist/aur-${pkg} && git checkout master`
        await Bun.file(`./dist/aur-${pkg}/PKGBUILD`).write(pkgbuild)
        await $`cd ./dist/aur-${pkg} && makepkg --printsrcinfo > .SRCINFO`
        await $`cd ./dist/aur-${pkg} && git add PKGBUILD .SRCINFO`
        if ((await $`cd ./dist/aur-${pkg} && git diff --cached --quiet`.nothrow()).exitCode === 0) break
        await $`cd ./dist/aur-${pkg} && git commit -m "Update to v${Script.version}"`
        await $`cd ./dist/aur-${pkg} && git push`
        break
      } catch {
        continue
      }
    }
  }

  // Homebrew formula
  const homebrewFormula = [
    "# typed: false",
    "# frozen_string_literal: true",
    "",
    "# This file was generated by GoReleaser. DO NOT EDIT.",
    "class Zode < Formula", // zodecode_change
    `  desc "The AI coding agent built for the terminal."`,
    `  homepage "https://kilo.ai"`, // zodecode_change
    `  version "${Script.version.split("-")[0]}"`,
    "",
    `  depends_on "ripgrep"`,
    "",
    "  on_macos do",
    "    if Hardware::CPU.intel?",
    `      url "https://github.com/Zode-Org/zodecode/releases/download/v${Script.version}/zode-darwin-x64.zip"`,
    `      sha256 "${macX64Sha}"`,
    "",
    "      def install",
    '        libexec.install "zode", "tree-sitter"', // zodecode_change
    '        (bin/"zode").write_env_script libexec/"zode", ZODE_TREE_SITTER_WASM_DIR: libexec/"tree-sitter"', // zodecode_change
    "      end",
    "    end",
    "    if Hardware::CPU.arm?",
    `      url "https://github.com/Zode-Org/zodecode/releases/download/v${Script.version}/zode-darwin-arm64.zip"`,
    `      sha256 "${macArm64Sha}"`,
    "",
    "      def install",
    '        libexec.install "zode", "tree-sitter"', // zodecode_change
    '        (bin/"zode").write_env_script libexec/"zode", ZODE_TREE_SITTER_WASM_DIR: libexec/"tree-sitter"', // zodecode_change
    "      end",
    "    end",
    "  end",
    "",
    "  on_linux do",
    "    if Hardware::CPU.intel? and Hardware::CPU.is_64_bit?",
    `      url "https://github.com/Zode-Org/zodecode/releases/download/v${Script.version}/zode-linux-x64.tar.gz"`,
    `      sha256 "${x64Sha}"`,
    "      def install",
    '        libexec.install "zode", "tree-sitter"', // zodecode_change
    '        (bin/"zode").write_env_script libexec/"zode", ZODE_TREE_SITTER_WASM_DIR: libexec/"tree-sitter"', // zodecode_change
    "      end",
    "    end",
    "    if Hardware::CPU.arm? and Hardware::CPU.is_64_bit?",
    `      url "https://github.com/Zode-Org/zodecode/releases/download/v${Script.version}/zode-linux-arm64.tar.gz"`,
    `      sha256 "${arm64Sha}"`,
    "      def install",
    '        libexec.install "zode", "tree-sitter"', // zodecode_change
    '        (bin/"zode").write_env_script libexec/"zode", ZODE_TREE_SITTER_WASM_DIR: libexec/"tree-sitter"', // zodecode_change
    "      end",
    "    end",
    "  end",
    "end",
    "",
    "",
  ].join("\n")

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    console.error("GITHUB_TOKEN is required to update homebrew tap")
    process.exit(1)
  }
  const tap = `https://x-access-token:${token}@github.com/Zode-Org/homebrew-tap.git` // zodecode_change
  await $`rm -rf ./dist/homebrew-tap`
  await $`git clone ${tap} ./dist/homebrew-tap`
  await Bun.file("./dist/homebrew-tap/zode.rb").write(homebrewFormula) // zodecode_change
  await $`cd ./dist/homebrew-tap && git add zode.rb` // zodecode_change
  if ((await $`cd ./dist/homebrew-tap && git diff --cached --quiet`.nothrow()).exitCode !== 0) {
    await $`cd ./dist/homebrew-tap && git commit -m "Update to v${Script.version}"`
    await $`cd ./dist/homebrew-tap && git push`
  }
}
