import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files"], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
const forbiddenDirectories = ["public/img/game/", "public/img/rules/"];
const prohibited = [
  /lobisomem por uma noite/i,
  /one night ultimate werewolf/i,
  /baralho oficial/i,
  /lobisomem-monstros\.vercel\.app/i,
];
const binary = /\.(?:png|jpg|jpeg|gif|ico|mp3|m4a|wav|woff2?)$/i;
const failures = [];

for (const file of files) {
  if (!existsSync(file)) continue;
  if (forbiddenDirectories.some((prefix) => file.startsWith(prefix))) {
    failures.push(`${file}: third-party reference directory is forbidden`);
  }
  if (binary.test(file) || file === "scripts/check-asset-rights.mjs") continue;
  const text = readFileSync(file, "utf8");
  for (const pattern of prohibited) {
    if (pattern.test(text)) failures.push(`${file}: prohibited competitor/reference copy (${pattern})`);
  }
  if (/status:\s*["']published["']/.test(text) && /publishable:\s*false/.test(text)) {
    failures.push(`${file}: a published theme has not passed its rights gate`);
  }
}

const inventory = JSON.parse(readFileSync("docs/legal/ASSET_PROVENANCE.json", "utf8"));
const assetFiles = files.filter((file) =>
  file === "app/favicon.ico" || /^(public\/(?:art|themes|audio|icons)\/)/.test(file),
);
for (const file of assetFiles) {
  const entry = inventory.assets.find((candidate) => file.startsWith(candidate.pathPrefix));
  if (!entry) failures.push(`${file}: missing provenance inventory entry`);
  if (entry?.use === "commercial" && entry.status !== "approved") {
    failures.push(`${file}: commercial asset is not approved`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Asset-rights check passed for ${assetFiles.length} tracked assets.`);
