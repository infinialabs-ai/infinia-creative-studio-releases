#!/usr/bin/env node
// Publish a new Infinia Creative Studio release.
//
//   node scripts/publish.mjs \
//     --version 0.7.0 \
//     --mac  "apps/shell/release/InfiniaCreativeStudio-0.7.0-arm64.dmg" \
//     --zip  "apps/shell/release/InfiniaCreativeStudio-0.7.0-arm64-mac.zip" \
//     --win  "apps/shell/release/InfiniaCreativeStudio-Setup-0.7.0.exe" \
//     --feed-mac "apps/shell/release/latest-mac.yml" \
//     --feed-win "apps/shell/release/latest.yml" \
//     --source-commit "$(git -C ../infinia-office rev-parse HEAD)" \
//     --notes /tmp/release-notes.md
//
// Rewrites release.json + SHA256SUMS from the artifacts on disk, then creates
// (or updates) the GitHub Release and uploads every asset plus the update
// feeds. Requires the gh CLI, authenticated with write access to this repo.
//
// Keep versioned assets immutable: never reuse a version or replace a file
// behind a published name — cut a new version instead.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const REPO = "infinialabs-ai/infinia-creative-studio-releases";
const root = path.resolve(import.meta.dirname, "..");

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i].replace(/^--/, ""), process.argv[i + 1]);
}
const version = args.get("version");
if (!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(version ?? "")) {
  console.error(
    "Usage: node scripts/publish.mjs --version X.Y.Z [--mac FILE] [--zip FILE] [--win FILE]",
  );
  console.error(
    "       [--feed-mac latest-mac.yml] [--feed-win latest.yml] [--source-commit SHA] [--notes FILE]",
  );
  process.exit(2);
}
const tag = `v${version}`;

const targets = [
  { key: "mac", target: "aarch64-apple-darwin", component: "desktop" },
  { key: "zip", target: "aarch64-apple-darwin", component: "desktop" },
  { key: "win", target: "x86_64-pc-windows", component: "desktop" },
];

async function describe(file) {
  const data = await readFile(file);
  return {
    sha256: createHash("sha256").update(data).digest("hex"),
    size: data.length,
  };
}

const assets = [];
for (const { key, target, component } of targets) {
  const file = args.get(key);
  if (!file) continue;
  const info = await describe(file);
  const name = path.basename(file);
  if (/\s/.test(name)) {
    throw new Error(
      `Artifact name contains spaces: "${name}". Fix artifactName in electron-builder.cjs.`,
    );
  }
  assets.push({
    name,
    target,
    component,
    sha256: info.sha256,
    size: info.size,
    url: `https://github.com/${REPO}/releases/download/${tag}/${name}`,
    file,
  });
}
if (!assets.length)
  throw new Error(
    "No artifacts given. Pass at least one of --mac/--zip/--win.",
  );

const manifest = {
  version: tag,
  channel: "stable",
  status: "published",
  source_commit: args.get("source-commit") ?? "",
  repository: REPO,
  release_url: `https://github.com/${REPO}/releases/tag/${tag}`,
  assets: assets.map(({ file, ...rest }) => rest),
};
await writeFile(
  path.join(root, "release.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
await writeFile(
  path.join(root, "SHA256SUMS"),
  assets.map((a) => `${a.sha256}  ${a.name}`).join("\n") + "\n",
);
console.log(
  `Wrote release.json and SHA256SUMS for ${tag} (${assets.length} assets).`,
);

// The electron-builder update feeds reference the artifact names; publish them
// alongside so the in-app updater can resolve this release.
const extra = ["release.json", "SHA256SUMS"];
for (const key of ["feed-mac", "feed-win"]) {
  const file = args.get(key);
  if (file && (await stat(file)).isFile()) extra.push(file);
}
console.log(
  "Commit release.json + SHA256SUMS before publishing if this is a new version.",
);

const gh = (argv, options) =>
  execFileSync("gh", argv, { stdio: "inherit", ...options });

const exists = (() => {
  try {
    execFileSync("gh", ["release", "view", tag, "-R", REPO], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
})();

const files = [...assets.map((a) => a.file), ...extra];
if (exists) {
  gh(["release", "upload", tag, "-R", REPO, ...files, "--clobber"]);
  console.log(`Updated release ${tag}.`);
} else {
  const notes = args.get("notes");
  const create = [
    "release",
    "create",
    tag,
    "-R",
    REPO,
    "--title",
    `Infinia Creative Studio ${tag}`,
    "--latest",
    ...files,
  ];
  if (notes) create.push("--notes-file", notes);
  gh(create);
  console.log(`Created release ${tag}.`);
}
console.log(`https://github.com/${REPO}/releases/tag/${tag}`);
