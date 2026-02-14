#!/bin/bash
# Début de session : log pour audit + rappel contexte
LOG_FILE=".cursor/session-log.txt"
mkdir -p .cursor

echo "[$(date +%Y-%m-%d\ %H:%M:%S)] Session started - YAM Dashboard" >> "$LOG_FILE"
exit 0
