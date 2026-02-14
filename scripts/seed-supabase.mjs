/**
 * Seed Supabase à partir de src/lib/seed.json
 * Usage: node scripts/seed-supabase.mjs
 * Prérequis: .env.local avec NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);
const seedPath = join(__dirname, '..', 'src', 'lib', 'seed.json');
const raw = readFileSync(seedPath, 'utf-8');
const data = JSON.parse(raw);

async function seed() {
  console.log('Inserting team...');
  const { error: e1 } = await supabase.from('team').upsert(data.team, { onConflict: 'id' });
  if (e1) throw e1;

  console.log('Inserting clients...');
  const clients = data.clients.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  }));
  const { error: e2 } = await supabase.from('clients').upsert(clients, { onConflict: 'id' });
  if (e2) throw e2;

  console.log('Inserting contacts...');
  const contacts = data.contacts.map((c) => ({
    id: c.id,
    client_id: c.clientId,
    name: c.name,
    role: c.role,
    email: c.email,
    phone: c.phone ?? null,
  }));
  const { error: e3 } = await supabase.from('contacts').upsert(contacts, { onConflict: 'id' });
  if (e3) throw e3;

  console.log('Inserting client_links...');
  if (data.clientLinks?.length) {
    const links = data.clientLinks.map((l) => ({
      id: l.id,
      client_id: l.clientId,
      title: l.title,
      url: l.url,
    }));
    const { error: e4 } = await supabase.from('client_links').upsert(links, { onConflict: 'id' });
    if (e4) throw e4;
  }

  console.log('Inserting documents...');
  const documents = data.documents.map((d) => ({
    id: d.id,
    client_id: d.clientId,
    type: d.type,
    title: d.title,
    content: d.content,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  }));
  const { error: e5 } = await supabase.from('documents').upsert(documents, { onConflict: 'id' });
  if (e5) throw e5;

  console.log('Inserting deliverables...');
  const deliverables = data.deliverables.map((d) => ({
    id: d.id,
    client_id: d.clientId ?? null,
    name: d.name,
    due_date: d.dueDate ?? null,
    type: d.type,
    status: d.status,
    assignee_id: d.assigneeId ?? null,
    category: d.category ?? null,
    delivered_at: d.deliveredAt ?? null,
    external_contractor: d.externalContractor ?? null,
    notes: d.notes ?? null,
    prix_facture: d.prixFacturé ?? null,
    cout_sous_traitance: d.coutSousTraitance ?? null,
    created_at: d.createdAt,
  }));
  const { error: e6 } = await supabase.from('deliverables').upsert(deliverables, { onConflict: 'id' });
  if (e6) throw e6;

  console.log('Inserting calls...');
  const calls = data.calls.map((c) => ({
    id: c.id,
    client_id: c.clientId ?? null,
    title: c.title,
    scheduled_at: c.scheduledAt ?? null,
    duration: c.duration,
    assignee_id: c.assigneeId ?? null,
    call_type: c.callType ?? null,
    notes: c.notes ?? null,
    created_at: c.createdAt,
  }));
  const { error: e7 } = await supabase.from('calls').upsert(calls, { onConflict: 'id' });
  if (e7) throw e7;

  console.log('Inserting compta_monthly...');
  const compta = data.comptaMonthly.map((r) => ({
    month: r.month,
    year: r.year,
    entrees: r.entrées,
    sorties: r.sorties,
    solde_cumule: r.soldeCumulé,
  }));
  const { error: e8 } = await supabase.from('compta_monthly').upsert(compta, { onConflict: 'month,year' });
  if (e8) throw e8;

  console.log('Seed done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
