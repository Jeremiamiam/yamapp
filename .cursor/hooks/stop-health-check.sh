#!/usr/bin/env bash
# À la fin de session : vérifie que le projet compile
# Si build fail ET loop_count < 2 : propose auto-fix à l'IA

INPUT=$(cat)
LOOP_COUNT=$(echo "$INPUT" | node -e "try{const d=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(d.loop_count||0)}catch(e){console.log(0)}" 2>/dev/null || echo "0")

# Max 2 boucles auto-fix pour éviter boucle infinie
if [ "$LOOP_COUNT" -ge 2 ]; then
  echo "{}"
  exit 0
fi

# Run build (tsc --noEmit plus rapide, ou npm run build pour full check)
BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT=$?

if [ $BUILD_EXIT -ne 0 ]; then
  # Build failed - écrire le log pour debug
  echo "$BUILD_OUTPUT" > .cursor/last-build-error.txt
  
  # Proposer à l'IA de corriger
  echo "{\"followup_message\":\"La build a échoué. Corrige les erreurs (voir .cursor/last-build-error.txt ou les erreurs dans le terminal).\"}"
  exit 0
fi

# Build OK - rien à faire
echo "{}"
exit 0
