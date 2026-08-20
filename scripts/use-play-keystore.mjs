import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createGraphqlClient } = require("eas-cli/build/commandUtils/context/contextUtils/createGraphqlClient");
const {
  getAndroidAppBuildCredentialsListAsync,
  updateAndroidAppBuildCredentialsAsync,
} = require("eas-cli/build/credentials/android/api/GraphqlClient");

const PLAY_SHA1 = "05:8C:EC:B4:5B:4E:FA:1E:4F:48:E6:BC:58:91:AE:9F:F3:54:09:41";
const NEW_PACKAGE = "com.Merkaall";
const OLD_PACKAGE = "com.merkaall.app";

function fmtSha1(raw) {
  const s = (raw ?? "").toUpperCase().replace(/:/g, "");
  return s.replace(/(.{2})/g, "$1:").slice(0, -1);
}

const auth = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".expo", "state.json"), "utf8")).auth;
const client = createGraphqlClient({
  accessToken: auth.accessToken ?? null,
  sessionSecret: auth.sessionSecret ?? null,
});

const base = {
  account: { name: "samueldourado.mendes" },
  projectName: "promocaopro-mobile",
};

const oldList = await getAndroidAppBuildCredentialsListAsync(client, {
  ...base,
  androidApplicationIdentifier: OLD_PACKAGE,
});
const newList = await getAndroidAppBuildCredentialsListAsync(client, {
  ...base,
  androidApplicationIdentifier: NEW_PACKAGE,
});

const oldDefault = oldList.find((b) => b.isDefault) ?? oldList[0];
const newDefault = newList.find((b) => b.isDefault) ?? newList[0];

if (!oldDefault?.androidKeystore) {
  throw new Error("Keystore antiga (com.merkaall.app) não encontrada no EAS.");
}
if (!newDefault) {
  throw new Error("Build credentials de com.Merkaall não encontradas.");
}

const oldSha1 = fmtSha1(oldDefault.androidKeystore.sha1CertificateFingerprint);
console.log("Keystore antiga:", oldSha1, oldSha1 === PLAY_SHA1 ? "✅ Play" : "❌");
console.log("Keystore nova:  ", fmtSha1(newDefault.androidKeystore?.sha1CertificateFingerprint));

if (oldDefault.androidKeystore.id === newDefault.androidKeystore?.id) {
  console.log("\nJá está usando a mesma keystore. Nada a fazer.");
  process.exit(0);
}

console.log("\nAssociando keystore da Play ao build com.Merkaall...");
await updateAndroidAppBuildCredentialsAsync(client, newDefault, {
  androidKeystoreId: oldDefault.androidKeystore.id,
});

const verify = await getAndroidAppBuildCredentialsListAsync(client, {
  ...base,
  androidApplicationIdentifier: NEW_PACKAGE,
});
const updated = verify.find((b) => b.id === newDefault.id);
const updatedSha1 = fmtSha1(updated?.androidKeystore?.sha1CertificateFingerprint);
console.log("Resultado:", updatedSha1, updatedSha1 === PLAY_SHA1 ? "✅ OK" : "❌ falhou");

if (updatedSha1 === PLAY_SHA1) {
  console.log("\nPróximo passo: npm run build:production");
  console.log("Depois envie o AAB na Play Console — deve aceitar sem reset.");
}
