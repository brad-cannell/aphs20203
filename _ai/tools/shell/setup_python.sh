#!/bin/sh
# Create or refresh the course runtime without modifying KWB's environment.
# Usage: sh _ai/tools/shell/setup_python.sh [path-to-python3]
set -eu

# Resolve from this script rather than the caller's working directory so the
# same setup command works from the repository root or an editor terminal.
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
course_root=$(CDPATH= cd -- "$script_dir/../../.." && pwd)
course_python="$course_root/.venv/bin/python"
base_python=${1:-python3}

# Virtual environments contain absolute interpreter paths, so create a fresh
# local environment rather than copying the existing one from KWB.
if [ ! -x "$course_python" ]; then
    if [ -e "$course_root/.venv" ]; then
        printf '%s\n' 'An incomplete .venv already exists. Inspect it before recreating the environment.' >&2
        exit 1
    fi
    "$base_python" -c 'import sys; sys.exit("Python 3.10 or newer is required.") if sys.version_info < (3, 10) else None'
    "$base_python" -m venv "$course_root/.venv"
fi

# Install all declared features together so QR codes, PDF export, conversion,
# and the manual Python chunks do not fail later on missing optional packages.
"$course_python" -m pip install -r "$course_root/requirements.txt"
"$course_python" -m pip check
"$course_python" -c 'import yaml, pptx, pdfplumber, qrcode, PIL, websocket, ipykernel; print("Presentation runtime imports passed.")'
printf 'Select this Python interpreter in Positron: %s\n' "$course_python"
