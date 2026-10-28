#!/usr/bin/env bash
set -euo pipefail

# Configuration with defaults
ITCH_USER="${ITCH_USER:-drean64}"
ITCH_GAME="${ITCH_GAME:-infinite-boulder-dash}"
ITCH_CHANNEL="${ITCH_CHANNEL:-html5}"
TARGET="${ITCH_USER}/${ITCH_GAME}:${ITCH_CHANNEL}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist"
ZIP_PATH="${DIST_DIR}/infinite-boulder-dash.zip"
BIN_DIR="${ROOT_DIR}/.bin"

echo "=============================================="
echo " itch.io Deploy: ${TARGET}"
echo "=============================================="

# 1. Ensure package exists
if [ ! -f "${ZIP_PATH}" ]; then
  echo "==> Zip archive not found. Packaging now..."
  bash "${SCRIPT_DIR}/package.sh"
else
  echo "==> Rebuilding fresh archive..."
  bash "${SCRIPT_DIR}/package.sh"
fi

# 2. Locate or download butler CLI
BUTLER_BIN=""
if command -v butler >/dev/null 2>&1; then
  BUTLER_BIN="butler"
elif [ -x "${BIN_DIR}/butler" ]; then
  BUTLER_BIN="${BIN_DIR}/butler"
else
  echo "==> itch.io 'butler' CLI not found. Downloading local binary to .bin/butler..."
  mkdir -p "${BIN_DIR}"
  
  OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
  ARCH="$(uname -m)"
  
  PLATFORM=""
  if [ "${OS}" = "darwin" ]; then
    if [ "${ARCH}" = "arm64" ]; then
      PLATFORM="darwin-arm64"
    else
      PLATFORM="darwin-amd64"
    fi
  elif [ "${OS}" = "linux" ]; then
    PLATFORM="linux-amd64"
  else
    echo "Error: Unsupported OS for auto-install: ${OS} (${ARCH})."
    echo "Please install butler manually: https://itch.io/docs/butler/installing.html"
    exit 1
  fi

  TMP_BUTLER_ZIP="/tmp/butler_${PLATFORM}.zip"
  curl -fsSL -o "${TMP_BUTLER_ZIP}" "https://broth.itch.zone/butler/${PLATFORM}/LATEST/archive/default"
  unzip -q -o "${TMP_BUTLER_ZIP}" -d "${BIN_DIR}"
  rm -f "${TMP_BUTLER_ZIP}"
  chmod +x "${BIN_DIR}/butler"
  BUTLER_BIN="${BIN_DIR}/butler"
  echo "--> Butler installed to ${BIN_DIR}/butler"
fi

echo "--> Using butler: $(${BUTLER_BIN} -V)"

# 3. Read version from package.json
VERSION="$(node -p "require('./package.json').version" 2>/dev/null || echo "1.0.0")"
GIT_HASH="$(git rev-parse --short HEAD 2>/dev/null || echo "")"
if [ -n "${GIT_HASH}" ]; then
  VERSION="${VERSION}+${GIT_HASH}"
fi

# 4. Push build to itch.io
echo "==> Uploading ${ZIP_PATH} to itch.io target '${TARGET}' (v${VERSION})..."
${BUTLER_BIN} push "${ZIP_PATH}" "${TARGET}" --userversion "${VERSION}"

echo ""
echo "✅ Successfully deployed to itch.io!"
echo "👉 https://${ITCH_USER}.itch.io/${ITCH_GAME}"
