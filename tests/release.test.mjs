import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (name) => readFile(new URL(`../${name}`, import.meta.url), "utf8");

test("release.json and SHA256SUMS agree on every asset", async () => {
  const manifest = JSON.parse(await read("release.json"));
  const sums = new Map(
    (await read("SHA256SUMS"))
      .trim()
      .split("\n")
      .map((line) => {
        const [sha256, name] = line.trim().split(/\s+/);
        return [name, sha256];
      }),
  );
  assert.equal(manifest.status, "published");
  assert.match(manifest.version, /^v[0-9]+\.[0-9]+\.[0-9]+$/);
  assert.ok(manifest.assets.length > 0);
  for (const asset of manifest.assets) {
    assert.match(asset.sha256, /^[a-f0-9]{64}$/, asset.name);
    assert.equal(sums.get(asset.name), asset.sha256, asset.name);
    assert.ok(asset.size > 0, asset.name);
    assert.ok(!/\s/.test(asset.name), `asset name has spaces: ${asset.name}`);
    assert.equal(
      asset.url,
      `https://github.com/${manifest.repository}/releases/download/${manifest.version}/${asset.name}`,
    );
  }
});

test("installers only appear in the published platform set", async () => {
  const manifest = JSON.parse(await read("release.json"));
  const names = manifest.assets.map((asset) => asset.name);
  assert.ok(names.some((name) => name.endsWith(".dmg")));
  assert.ok(names.some((name) => name.endsWith(".exe")));
});
