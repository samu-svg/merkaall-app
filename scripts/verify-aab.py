import sys
import zipfile
from pathlib import Path
from asn1crypto import cms
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes

aab = Path(sys.argv[1])
with zipfile.ZipFile(aab) as zf:
    rsa = next(n for n in zf.namelist() if n.startswith("META-INF/") and n.endswith(".RSA"))
    cert_der = cms.ContentInfo.load(zf.read(rsa))["content"]["certificates"][0].dump()
    app = zf.read("base/assets/app.config").decode("utf8")

x = x509.load_der_x509_certificate(cert_der, default_backend())
sha1 = x.fingerprint(hashes.SHA1()).hex().upper()
print("SHA1:", ":".join(sha1[i : i + 2] for i in range(0, len(sha1), 2)))
print("package:", "com.Merkaall" if "com.Merkaall" in app else "OUTRO")
print("versionCode 6:", "versionCode\":6" in app.replace(" ", "") or "versionCode\": 6" in app)
