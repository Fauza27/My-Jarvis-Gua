import { readdir, readFile, mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
// Resolve Next.js's existing image optimizer; avoid an additional native runtime.
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");
const root = path.resolve(import.meta.dirname, "..");
async function sources(directory) {
  return (
    await Promise.all(
      (await readdir(directory, { withFileTypes: true })).map(async (file) => {
        const filename = path.join(directory, file.name);
        return file.isDirectory()
          ? sources(filename)
          : /\.(tsx?|css)$/.test(filename)
            ? [filename]
            : [];
      }),
    )
  ).flat();
}
const sourceFiles = await sources(path.join(root, "src"));
const texts = await Promise.all(
  sourceFiles.map((file) => readFile(file, "utf8")),
);
const assets = [
  ...new Set(
    texts.flatMap((text) =>
      [
        ...text.matchAll(/["']\/(?:optimized\/)?([^"'\n]+\.(?:png|webp))["']/g),
      ].map((match) => match[1].replace(/\.webp$/, ".png")),
    ),
  ),
];
const report = [];
await mkdir(path.join(root, "public", "optimized"), { recursive: true });
for (const asset of assets) {
  const source = path.join(root, "public", asset);
  const outputName = asset.replace(/\.png$/, ".webp");
  const output = path.join(root, "public", "optimized", outputName);
  const width = /fullbody/i.test(asset)
    ? 800
    : /login-head/i.test(asset)
      ? 320
      : 192;
  await sharp(source)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 88, effort: 6 })
    .toFile(output);
  report.push({
    asset,
    sourceBytes: (await stat(source)).size,
    outputBytes: (await stat(output)).size,
    maxWidth: width,
  });
  for (let index = 0; index < texts.length; index++)
    texts[index] = texts[index].replaceAll(
      `/${asset}`,
      `/optimized/${outputName}`,
    );
}
for (let index = 0; index < sourceFiles.length; index++)
  await writeFile(sourceFiles[index], texts[index]);
await writeFile(
  path.join(root, "..", "docs", "project-review", "optimized-assets.json"),
  JSON.stringify(report, null, 2),
);
console.log(
  `Generated ${report.length} WebP assets; ${(report.reduce((sum, row) => sum + row.outputBytes, 0) / 1024).toFixed(1)} KiB total.`,
);
