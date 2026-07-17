#!/bin/bash
# Double-click launcher for macOS. Starts the local server and opens the
# dashboard in your browser. Keep this window open while you use it; close
# it to stop. First time: if macOS blocks it, right-click → Open → Open.
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install it once from https://nodejs.org (LTS), then double-click this again."
  echo "Press any key to close…"; read -r -n 1; exit 1
fi
node serve.mjs
