#!/bin/bash
# Après édition : typecheck rapide + diagnostic pour l'IA
# Écrit les erreurs dans .cursor/last-diag.txt pour que l'IA puisse les corriger

DIAG_FILE=".cursor/last-diag.txt"
mkdir -p .cursor

# Typecheck (rapide, pas de build)
if npx tsc --noEmit 2>&1 | tee "$DIAG_FILE" | grep -q "error TS"; then
  # Erreurs TypeScript trouvées - le fichier contient le détail
  echo "{\"note\":\"TypeScript errors written to $DIAG_FILE\"}"
else
  # Pas d'erreurs - on vide le fichier pour pas induire en erreur
  echo "" > "$DIAG_FILE"
fi
exit 0
