import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createGraphqlClient } = require("eas-cli/build/commandUtils/context/contextUtils/createGraphqlClient");
const { getAndroidAppBuildCredentialsListAsync } = require("eas-cli/build/credentials/android/api/GraphqlClient");

const PLAY_SHA1 = "05:8C:EC:B4:5B:4E:FA:1E:4F:48:E6:BC:58:91:AE:9F:F3:54:09:41";
const EAS_SHA1 = "B7:3A:4A:24:91:9C:F4:F7:1E:2D:FE:12:01:7E:0D:05:A5:7C:0E:F9";

function fmtSha1(raw) {
  const s = (raw ?? "").toUpperCase().replace(/:/g, "");
  return s.replace(/(.{2})/g, "$1:").slice(0, -1);
}

const auth = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".expo", "state.json"), "utf8")).auth;
const client = createGraphqlClient({
  accessToken: auth.accessToken ?? null,
  sessionSecret: auth.sessionSecret ?? null,
});

for (const pkg of ["com.Merkaall", "com.merkaall.app"]) {
  console.log(`\n=== EAS keystores (${pkg}) ===`);
  const list = await getAndroidAppBuildCredentialsListAsync(client, {
    account: { name: "samueldourado.mendes" },
    projectName: "promocaopro-mobile",
    androidApplicationIdentifier: pkg,
  });
  if (!list.length) {
    console.log("(nenhuma)");
    continue;
  }
  for (const bc of list) {
    const sha1 = fmtSha1(bc.androidKeystore?.sha1CertificateFingerprint);
    const match =
      sha1 === PLAY_SHA1 ? "✅ CHAVE DA PLAY" : sha1 === EAS_SHA1 ? "EAS atual" : "outra";
    console.log(`- ${bc.name} | default=${bc.isDefault} | SHA1=${sha1} | ${match}`);
  }
}

console.log("\n=== Referência ===");
console.log("Play espera:", PLAY_SHA1);
console.log("EAS atual:  ", EAS_SHA1);
