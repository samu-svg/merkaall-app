/**
 * Baixa o keystore de produção do EAS e gera upload_certificate.pem
 * para solicitar reset da upload key no Google Play Console.
 *
 * Uso: node scripts/export-play-upload-cert.mjs
 * Requer: eas login (sessão ativa)
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.join(__dirname, "..");

import os from "node:os";

const { createGraphqlClient } = require("eas-cli/build/commandUtils/context/contextUtils/createGraphqlClient");

function loadExpoAuth() {
  const statePath = path.join(os.homedir(), ".expo", "state.json");
  const raw = require("node:fs").readFileSync(statePath, "utf8");
  const auth = JSON.parse(raw)?.auth;
  if (!auth?.sessionSecret && !auth?.accessToken) {
    throw new Error("Faça login: npx eas login");
  }
  return auth;
}
const { getDefaultAndroidAppBuildCredentialsAsync } = require("eas-cli/build/credentials/android/api/GraphqlClient");
const { DownloadKeystore } = require("eas-cli/build/credentials/android/actions/DownloadKeystore");

const PACKAGE = "com.Merkaall";
const PLAY_EXPECTED_SHA1 = "05:8C:EC:B4:5B:4E:FA:1E:4F:48:E6:BC:58:91:AE:9F:F3:54:09:41";

async function main() {
  const auth = loadExpoAuth();
  const graphqlClient = createGraphqlClient({
    accessToken: auth.accessToken ?? null,
    sessionSecret: auth.sessionSecret ?? null,
  });
  const appLookup = {
    account: { name: "samueldourado.mendes" },
    projectName: "promocaopro-mobile",
    androidApplicationIdentifier: PACKAGE,
  };

  const buildCredentials = await getDefaultAndroidAppBuildCredentialsAsync(graphqlClient, appLookup);
  if (!buildCredentials?.androidKeystore) {
    throw new Error("Keystore de produção não encontrado no EAS.");
  }

  const keystore = buildCredentials.androidKeystore;
  const easSha1 = (keystore.sha1CertificateFingerprint ?? "").toUpperCase();
  const easSha1Fmt = easSha1.replace(/(.{2})(?=.)/g, "$1:");

  console.log("\n=== Keystore EAS (produção) ===");
  console.log("SHA1 EAS:     ", easSha1Fmt || "(indisponível)");
  console.log("SHA1 Play:    ", PLAY_EXPECTED_SHA1);
  console.log("Key alias:    ", keystore.keyAlias);
  console.log("");

  if (easSha1Fmt === PLAY_EXPECTED_SHA1) {
    console.log("As chaves já coincidem. O erro pode ser de um AAB antigo — use o build production mais recente.");
    return;
  }

  const jksPath = path.join(projectDir, "@samueldourado.mendes__promocaopro-mobile.jks");
  const pemPath = path.join(projectDir, "upload_certificate.pem");

  await new DownloadKeystore({
    app: appLookup,
    outputPath: jksPath,
    displaySensitiveInformation: true,
  }).runAsync({ projectDir, nonInteractive: true }, buildCredentials);

  const jksBuffer = await fs.readFile(jksPath);
  let pem;
  try {
    const { exportUploadCertificatePem } = await import("./lib/export-jks-cert.mjs");
    pem = await exportUploadCertificatePem(jksBuffer, keystore.keystorePassword, keystore.keyAlias);
  } catch {
    // Fallback: extrai o certificado do AAB mais recente (mesma upload key)
    const { exportPemFromLatestProductionAab } = await import("./lib/export-pem-from-aab.mjs");
    pem = await exportPemFromLatestProductionAab(graphqlClient, appLookup);
  }
  await fs.writeFile(pemPath, pem, "utf8");

  console.log("\n=== Próximo passo (Google Play Console) ===");
  console.log("1. Play Console → seu app Merkaall → Configuração → Integridade do app");
  console.log("2. Assinatura de apps → Solicitar redefinição da chave de upload");
  console.log("3. Envie o arquivo:", pemPath);
  console.log("4. Aguarde aprovação da Google (1–3 dias úteis)");
  console.log("5. Gere novo build: npm run build:production");
  console.log("6. Envie o AAB mais recente (package com.Merkaall)\n");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
