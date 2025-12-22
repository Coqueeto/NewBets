#!/usr/bin/env bash
# Generate PNG PWA icons from the SVG source using ImageMagick (if available).
# Usage: ./scripts/create_pwa_icons.sh

set -euo pipefail

SVG_SRC="NewBets/icon.svg"
OUT_DIR="NewBets"

if [ ! -f "$SVG_SRC" ]; then
  echo "SVG source not found: $SVG_SRC"
  exit 1
fi

if ! command -v convert >/dev/null 2>&1; then
  echo "ImageMagick 'convert' not found. Install ImageMagick or create PNGs manually."
  exit 1
fi

mkdir -p "$OUT_DIR"

echo "Generating $OUT_DIR/icon-192.png and $OUT_DIR/icon-512.png from $SVG_SRC"
convert "$SVG_SRC" -resize 192x192 "$OUT_DIR/icon-192.png"
convert "$SVG_SRC" -resize 512x512 "$OUT_DIR/icon-512.png"

echo "Done. Add these files to the repo (git add) before deploying."
