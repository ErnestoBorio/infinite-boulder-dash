#!/usr/bin/env bash
set -euo pipefail

# Determine script and workspace root directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

DIST_DIR="${ROOT_DIR}/dist"
STAGE_DIR="${DIST_DIR}/infinite-boulder-dash"
ZIP_NAME="infinite-boulder-dash.zip"
ZIP_PATH="${DIST_DIR}/${ZIP_NAME}"

echo "==> Packaging Infinite Boulder Dash for itch.io..."

# Ensure a clean staging area
rm -rf "${DIST_DIR}"
mkdir -p "${STAGE_DIR}"

# Copy client game assets
echo "--> Staging game assets..."
cp "${ROOT_DIR}/index.html" "${STAGE_DIR}/"
cp "${ROOT_DIR}/LICENSE.md" "${STAGE_DIR}/"
cp "${ROOT_DIR}/infinite-boulder-dash.png" "${STAGE_DIR}/"
cp -R "${ROOT_DIR}/css" "${STAGE_DIR}/"
cp -R "${ROOT_DIR}/images" "${STAGE_DIR}/"
cp -R "${ROOT_DIR}/src" "${STAGE_DIR}/"

# Clean any OS metadata artifacts in staging
find "${STAGE_DIR}" -name ".DS_Store" -delete 2>/dev/null || true

# Create the zip archive (from inside staging folder so index.html is at zip root)
echo "--> Creating ${ZIP_NAME}..."
(
  cd "${STAGE_DIR}"
  zip -r -q "${ZIP_PATH}" . -x "*.DS_Store"
)

# Clean up raw staging directory, keeping only the zip
rm -rf "${STAGE_DIR}"

ZIP_SIZE=$(du -h "${ZIP_PATH}" | awk '{print $1}')
echo "==> Package complete: ${ZIP_PATH} (${ZIP_SIZE})"
