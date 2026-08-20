import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

export async function exportPemFromAabBuffer(aabBuffer) {
  const aabPath = path.join(tmpdir(), `merkaall-${Date.now()}.aab`);
  await writeFile(aabPath, aabBuffer);

  const py = `
import sys, zipfile
from pathlib import Path
from asn1crypto import cms
from cryptography import x509
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

aab = Path(sys.argv[1])
with zipfile.ZipFile(aab) as zf:
    rsa = next(n for n in zf.namelist() if n.startswith('META-INF/') and n.endswith('.RSA'))
    data = zf.read(rsa)
content_info = cms.ContentInfo.load(data)
cert_der = content_info['content']['certificates'][0].dump()
x = x509.load_der_x509_certificate(cert_der, default_backend())
print(x.public_bytes(serialization.Encoding.PEM).decode())
`;

  try {
    const { stdout } = await execFileAsync("python", ["-c", py, aabPath], { encoding: "utf8" });
    await unlink(aabPath).catch(() => {});
    if (!stdout.includes("BEGIN CERTIFICATE")) {
      throw new Error("PEM inválido");
    }
    return stdout;
  } catch (err) {
    await unlink(aabPath).catch(() => {});
    throw err;
  }
}

export async function exportPemFromLatestProductionAab(graphqlClient, appLookup) {
  const { formatProjectFullName } = require("eas-cli/build/credentials/android/api/GraphqlClient");
  const fullName = formatProjectFullName(appLookup);

  const query = `
    query Builds($fullName: String!) {
      app {
        byFullName(fullName: $fullName) {
          builds(offset: 0, limit: 5, filter: { platform: ANDROID, status: FINISHED, distribution: STORE }) {
            artifacts { buildUrl }
          }
        }
      }
    }
  `;

  const result = await graphqlClient.query(query, { fullName }).toPromise();
  const buildUrl = result.data?.app?.byFullName?.builds?.[0]?.artifacts?.buildUrl;
  if (!buildUrl) {
    throw new Error("Nenhum build production AAB encontrado.");
  }

  const response = await fetch(buildUrl);
  if (!response.ok) {
    throw new Error(`Falha ao baixar AAB: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return exportPemFromAabBuffer(buffer);
}
