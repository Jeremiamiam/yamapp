#!/usr/bin/env bash
# Guardrail : bloque les commandes destructrices avant exécution
# Reçoit JSON via stdin, retourne permission allow/deny

node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const cmd = (data.command || '').toString();

const blocked = /rm\s+-rf|git\s+reset\s+--hard|git\s+push\s+--force|DROP\s+TABLE|TRUNCATE\s+/i.test(cmd);

if (blocked) {
  console.log(JSON.stringify({
    permission: 'deny',
    user_message: 'Commande bloquée par le guardrail YAM : opération destructive.',
    agent_message: 'Cette commande a été bloquée pour raisons de sécurité.'
  }));
} else {
  console.log(JSON.stringify({ permission: 'allow' }));
}
"
