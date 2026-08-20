import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import crypto from "node:crypto";

const execFileAsync = promisify(execFile);

async function findKeytool() {
  const candidates = [
    process.env.KEYTOOL_PATH,
    "keytool",
    "C:\\Program Files\\Android\\Android Studio\\jbr\\bin\\keytool.exe",
    "C:\\Program Files\\Java\\jdk-21\\bin\\keytool.exe",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await execFileAsync(candidate, ["-help"]);
      return candidate;
    } catch {
      // try next
    }
  }
  return null;
}

export async function exportUploadCertificatePem(jksBuffer, keystorePassword, keyAlias) {
  const keytool = await findKeytool();
  if (keytool) {
    const jksPath = path.join(tmpdir(), `merkaall-${Date.now()}.jks`);
    const pemPath = path.join(tmpdir(), `merkaall-${Date.now()}.pem`);
    try {
      await writeFile(jksPath, jksBuffer);
      await execFileAsync(keytool, [
        "-export",
        "-rfc",
        "-keystore",
        jksPath,
        "-alias",
        keyAlias,
        "-file",
        pemPath,
        "-storepass",
        keystorePassword,
      ]);
      const { readFile } = await import("node:fs/promises");
      return readFile(pemPath, "utf8");
    } finally {
      await unlink(jksPath).catch(() => {});
      await unlink(pemPath).catch(() => {});
    }
  }

  // Fallback: pyjks (pip install pyjks)
  try {
    const { spawnSync } = await import("node:child_process");
    const jksPath = path.join(tmpdir(), `merkaall-${Date.now()}.jks`);
    await writeFile(jksPath, jksBuffer);
    const py = spawnSync(
      "python",
      [
        "-c",
        `
import sys, jks
from cryptography.hazmat.primitives import serialization
from cryptography import x509
ks = jks.KeyStore.load(sys.argv[1], sys.argv[2])
pk = ks.private_keys[sys.argv[3]]
cert = x509.load_der_x509_certificate(pk.cert_chain[0][1])
print(cert.public_bytes(serialization.Encoding.PEM).decode())
`,
        jksPath,
        keystorePassword,
        keyAlias,
      ],
      { encoding: "utf8" }
    );
    await unlink(jksPath).catch(() => {});
    if (py.status === 0 && py.stdout?.includes("BEGIN CERTIFICATE")) {
      return py.stdout;
    }
  } catch {
    // fall through
  }

  throw new Error(
    "Instale JDK (keytool) ou rode: pip install pyjks cryptography\n" +
      "Depois execute novamente: node scripts/export-play-upload-cert.mjs"
  );
}

export function sha1FingerprintFromPem(pem) {
  const cert = new crypto.X509Certificate(pem);
  return cert.fingerprint.replace(/:/g, "").toUpperCase().replace(/(.{2})(?=.)/g, "$1:");
}
