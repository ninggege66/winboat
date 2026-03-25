#!/bin/bash
set -e
DEB_FILE=$(ls dist/winboat-*.deb | head -n 1)
if [ -f "$DEB_FILE" ]; then
    echo "Installing $DEB_FILE..."
    echo 123 | sudo -S dpkg -i "$DEB_FILE"
    echo "Installation completed."
else
    echo "Error: .deb file not found in dist/. Please run build.sh first."
    exit 1
fi
