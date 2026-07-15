#!/bin/bash
# Frenchies Review Studio — double-click launcher (macOS).
# Double-click this file in Finder to start the app. No terminal needed.
# First time only: if macOS blocks it, right-click the file → Open → Open.

cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  Node.js is not installed."
  echo "  Get it from https://nodejs.org  (choose the \"LTS\" download),"
  echo "  then double-click this file again."
  echo ""
  read -n 1 -s -r -p "  Press any key to close…"
  exit 1
fi

echo ""
echo "  Frenchies Review Studio  →  http://localhost:3000"
echo "  Keep this window open while you use the app."
echo "  To stop: close this window, or press Control-C."
echo ""

# Open the browser a moment after the server starts.
( sleep 1.5; open "http://localhost:3000" ) >/dev/null 2>&1 &

node server.js

echo ""
echo "  Server stopped."
read -n 1 -s -r -p "  Press any key to close…"
