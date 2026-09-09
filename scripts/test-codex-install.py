"""Optional local CLI smoke test; uses an isolated home and makes no model requests."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

root = Path(__file__).resolve().parent.parent
cli = shutil.which("codex")
if not cli:
    raise SystemExit("Codex CLI is required for this optional installation smoke test.")
with tempfile.TemporaryDirectory(prefix="workflow-kit-native-") as directory:
    env = dict(os.environ, CODEX_HOME=str(Path(directory) / "codex"))
    Path(env["CODEX_HOME"]).mkdir()
    for arguments in [
        ["plugin", "marketplace", "add", str(root), "--json"],
        ["plugin", "add", "workflow-kit@derekwelton-workflow", "--json"],
    ]:
        result = subprocess.run([cli, *arguments], env=env, capture_output=True, text=True, timeout=40)
        if result.returncode:
            raise SystemExit(result.stderr)
        response = json.loads(result.stdout)
    installed = Path(response["installedPath"])
    subprocess.run([shutil.which("node"), str(installed / "scripts/validate-package.mjs"), str(installed)], check=True)
    subprocess.run([shutil.which("node"), str(installed / "skills/orchestrate/scripts/workload-manifest.mjs"), "pair", "--pair", "cross", "--implementer", "astra"], check=True)
    print("Native Codex installation and packaged runtime passed in an isolated home.")
