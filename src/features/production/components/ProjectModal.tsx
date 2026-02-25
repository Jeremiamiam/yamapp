'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import type { Project, BillingStatus } from '@/types';
import { Modal, FormField, Input, Select, Button } from '@/components/ui';
import { DateInput } from '@/components/ui/DateInput';
import {
  computeProjectBilling,
  formatEuro,
  PROJECT_BILLING_LABELS,
  PROJECT_BILLING_COLORS,
} from '@/lib/project-billing';

const FolderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const BILLING_STATUS_LABEL: Record<BillingStatus, string> = {
  pending: 'En attente',
  deposit: 'Acompte',
  progress: 'Avancement',
  balance: 'Soldé',
};

const BILLING_STATUS_DOT: Record<BillingStatus, string> = {
  pending: 'bg-[var(--text-muted)]',
  deposit: 'bg-[var(--accent-amber)]',
  progress: 'bg-[var(--accent-violet)]',
  balance: 'bg-[var(--accent-lime)]',
};

interface ProjectModalProps {
  project?: Project;
  presetClientId?: string;
  /** Onglet affiché à l’ouverture (mode édition uniquement) */
  initialTab?: 'projet' | 'billing';
  onClose: () => void;
}

export function ProjectModal({ project, presetClientId, initialTab, onClose }: ProjectModalProps) {
  const {
    clients,
    deliverables,
    addProject,
    addDeliverable,
    updateProject,
    deleteProject,
    assignDeliverableToProject,
    getDeliverablesByProjectId,
    getClientById,
  } = useAppStore();

  const isEdit = !!project;

  const [name, setName] = useState(project?.name || '');
  const [clientId, setClientId] = useState(project?.clientId || presetClientId || '');
  const [isActive, setIsActive] = useState(project ? project.isActive !== false : false);
  const [quoteAmount, setQuoteAmount] = useState(project?.quoteAmount?.toString() || '');
  const [quoteDate, setQuoteDate] = useState(project?.quoteDate || '');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [addingProduct, setAddingProduct] = useState(false);

  const [tab, setTab] = useState<'projet' | 'billing'>(initialTab ?? 'projet');
  const [depositAmount, setDepositAmount] = useState(project?.depositAmount?.toString() || '');
  const [depositDate, setDepositDate] = useState(project?.depositDate || '');
  const [progressAmounts, setProgressAmounts] = useState<string[]>(
    (project?.progressAmounts || []).map(String)
  );
  const [progressDates, setProgressDates] = useState<string[]>(project?.progressDates || []);
  const [balanceDate, setBalanceDate] = useState(project?.balanceDate || '');

  useEffect(() => {
    if (project) setIsActive(project.isActive !== false);
  }, [project?.id]);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  // Deliverables currently in the project (deliverables en deps pour recalcul après ajout/assignation)
  const projectDeliverables = useMemo(
    () => (project ? getDeliverablesByProjectId(project.id) : []),
    [project, getDeliverablesByProjectId, deliverables]
  );

  // Assignable: same client, not already in another project
  const assignableDeliverables = useMemo(() => {
    if (!clientId) return [];
    return deliverables.filter(
      (d) =>
        d.clientId === clientId &&
        !d.projectId &&
        !(project && projectDeliverables.some((pd) => pd.id === d.id))
    );
  }, [clientId, deliverables, project, projectDeliverables]);

  // Local state to track assignments (only relevant before save for new project)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(projectDeliverables.map((d) => d.id))
  );

  const toggleDeliverable = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim() || !clientId) return;
    setSaving(true);

    if (isEdit && project) {
      await updateProject(project.id, {
        name: name.trim(),
        clientId,
        isActive,
        // Champ vidé = null en base pour garder BDD et affichage cohérents
        quoteAmount: quoteAmount.trim() !== '' ? parseFloat(quoteAmount) : null,
        quoteDate: quoteDate || undefined,
        depositAmount: depositAmount ? parseFloat(depositAmount) : undefined,
        depositDate: depositDate || undefined,
        progressAmounts: progressAmounts.map(Number).filter((n) => n > 0),
        progressDates: progressDates.filter((_, i) => Number(progressAmounts[i]) > 0),
        balanceDate: balanceDate || undefined,
      });

      // Unassign deliverables removed
      const removedIds = projectDeliverables
        .filter((d) => !selectedIds.has(d.id))
        .map((d) => d.id);
      for (const id of removedIds) {
        await assignDeliverableToProject(id, null);
      }

      // Assign new deliverables
      const addedIds = [...selectedIds].filter(
        (id) => !projectDeliverables.some((d) => d.id === id)
      );
      for (const id of addedIds) {
        await assignDeliverableToProject(id, project.id);
      }
    } else {
      const newProject = await addProject({
        name: name.trim(),
        clientId,
        isActive,
        quoteAmount: quoteAmount ? parseFloat(quoteAmount) : undefined,
        quoteDate: quoteDate || undefined,
      });

      if (newProject) {
        for (const id of selectedIds) {
          await assignDeliverableToProject(id, newProject.id);
        }
      }
    }

    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!project) return;
    setSaving(true);
    await deleteProject(project.id);
    setSaving(false);
    onClose();
  };

  const allForClient = useMemo(() => {
    return [...projectDeliverables, ...assignableDeliverables];
  }, [projectDeliverables, assignableDeliverables]);

  const handleAddProduct = async () => {
    if (!newProductName.trim() || !clientId || !project) return;
    setAddingProduct(true);
    const beforeIds = new Set(useAppStore.getState().deliverables.map((d) => d.id));
    await addDeliverable({
      clientId,
      name: newProductName.trim(),
      type: 'creative',
      status: 'to_quote',
      billingStatus: 'pending',
      inBacklog: false,
    } as Parameters<typeof addDeliverable>[0]);
    const newDel = useAppStore.getState().deliverables.find((d) => !beforeIds.has(d.id));
    if (newDel) {
      await assignDeliverableToProject(newDel.id, project.id);
      setSelectedIds((prev) => new Set([...prev, newDel.id]));
    }
    setNewProductName('');
    setAddingProduct(false);
  };

  const addProgressRow = () => {
    setProgressAmounts((prev) => [...prev, '']);
    setProgressDates((prev) => [...prev, '']);
  };

  const removeProgressRow = (idx: number) => {
    setProgressAmounts((prev) => prev.filter((_, i) => i !== idx));
    setProgressDates((prev) => prev.filter((_, i) => i !== idx));
  };

  const displayProject: Project | null = isEdit && project
    ? {
        ...project,
        quoteAmount: quoteAmount ? parseFloat(quoteAmount) : undefined,
        quoteDate: quoteDate || undefined,
        depositAmount: depositAmount ? parseFloat(depositAmount) : undefined,
        depositDate: depositDate || undefined,
        progressAmounts: progressAmounts.map(Number).filter((n) => n > 0),
        progressDates: progressDates.filter((_, i) => Number(progressAmounts[i]) > 0),
        balanceDate: balanceDate || undefined,
      }
    : null;

  const billing = useMemo(
    () => displayProject ? computeProjectBilling(displayProject, deliverables) : null,
    [displayProject, deliverables]
  );
  const overBudget = displayProject?.quoteAmount && billing ? billing.totalPaid > displayProject.quoteAmount : false;
  const client = clientId ? getClientById(clientId) : null;

  const modalTitle = isEdit ? (name || project?.name) || 'Projet' : 'Nouveau projet';
  const modalSubtitle = isEdit && client ? client.name : 'Projet';

  return (
    <Modal
      isOpen
      onClose={onClose}
      onSubmit={handleSave}
      title={modalTitle}
      subtitle={modalSubtitle}
      icon={<FolderIcon />}
      iconBg="bg-[var(--accent-cyan)]/10"
      iconColor="text-[var(--accent-cyan)]"
      size="xl"
      footer={
        <div className="w-full flex items-center gap-3">
          {isEdit && (
            confirmDelete ? (
              <>
                <span className="text-sm text-[var(--text-muted)]">Confirmer la suppression ?</span>
                <Button type="button" variant="danger" onClick={handleDelete} disabled={saving}>
                  Supprimer
                </Button>
                <Button type="button" variant="secondary" onClick={() => setConfirmDelete(false)}>
                  Non
                </Button>
              </>
            ) : (
              <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
                Supprimer
              </Button>
            )
          )}
          <div className="flex-1" />
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={saving || !name.trim() || !clientId}
          >
            {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer le projet'}
          </Button>
        </div>
      }
    >
      {isEdit && (
        <div className="flex border-b border-[var(--border-subtle)] -mx-6 px-6 -mt-2 mb-5">
          <button
            type="button"
            onClick={() => setTab('projet')}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer -mb-px ${
              tab === 'projet'
                ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Projet & produits
          </button>
          <button
            type="button"
            onClick={() => setTab('billing')}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer -mb-px ${
              tab === 'billing'
                ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Facturation
          </button>
          {billing && (
            <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium ${PROJECT_BILLING_COLORS[billing.status].bg} ${PROJECT_BILLING_COLORS[billing.status].text}`}>
              {PROJECT_BILLING_LABELS[billing.status]}
            </span>
          )}
        </div>
      )}

      {(!isEdit || tab === 'projet') && (
        <div className="space-y-5">
          <FormField label="Nom du projet" required>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Refonte site web"
              autoFocus
            />
          </FormField>

          <FormField label="Statut projet">
            <div className="flex rounded-lg border border-[var(--border-subtle)] p-0.5 bg-[var(--bg-tertiary)]">
              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  !isActive ? 'bg-[var(--accent-violet)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Inactif
              </button>
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  isActive ? 'bg-[var(--accent-cyan)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Actif
              </button>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
              {isActive ? 'Devis, acompte, etc. éditables' : 'Potentiel uniquement (pipeline)'}
            </p>
          </FormField>

          <FormField label="Client" required>
            <Select
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                setSelectedIds(new Set());
              }}
              disabled={isEdit}
              options={[
                { value: '', label: 'Sélectionner un client' },
                ...clients.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </FormField>

          <FormField label="Devis global (optionnel)">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="number"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  placeholder="Montant"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">€</span>
              </div>
              <DateInput value={quoteDate} onChange={setQuoteDate} />
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              Sans devis global, le projet est un simple regroupement. La facturation reste individuelle par produit.
            </p>
          </FormField>

          {clientId && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">
                Produits du projet ({selectedIds.size})
              </label>
              <div className="max-h-[200px] overflow-y-auto rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
                {allForClient.length === 0 && !isEdit ? (
                  <p className="text-xs text-[var(--text-muted)] text-center py-4">Aucun produit disponible pour ce client</p>
                ) : (
                  allForClient.map((d) => {
                    const isSelected = selectedIds.has(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDeliverable(d.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer ${
                          isSelected ? 'bg-[var(--accent-cyan)]/5' : 'hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-[var(--accent-cyan)] border-[var(--accent-cyan)]'
                            : 'border-[var(--border-subtle)]'
                        }`}>
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs text-[var(--text-primary)] truncate flex-1">{d.name}</span>
                        {d.prixFacturé != null && d.prixFacturé > 0 && (
                          <span className="text-[10px] font-semibold text-[#22c55e]">
                            {d.prixFacturé.toLocaleString('fr-FR')} €
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {isEdit && (
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddProduct(); } }}
                    placeholder="Nouveau produit…"
                    className="flex-1 py-2 text-sm"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddProduct}
                    disabled={!newProductName.trim() || addingProduct}
                    className="flex-shrink-0"
                  >
                    {addingProduct ? '…' : '+ Produit'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isEdit && tab === 'billing' && project && billing && (
        <div className="flex flex-col">
          {displayProject?.quoteAmount && displayProject.quoteAmount > 0 && (
            <div className="py-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs text-[var(--text-muted)]">Progression de facturation</span>
                <span className={`text-sm font-bold ${overBudget ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
                  {formatEuro(billing.totalPaid)} / {formatEuro(displayProject.quoteAmount)}
                  {overBudget && (
                    <span className="text-xs ml-1 text-red-400">(dépassé de {formatEuro(billing.totalPaid - displayProject.quoteAmount)})</span>
                  )}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-500' : 'bg-[var(--accent-cyan)]'}`}
                  style={{ width: `${Math.min(100, billing.progressPercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
                <span>{billing.progressPercent}%</span>
                <span>Restant : {formatEuro(billing.remaining)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x divide-[var(--border-subtle)]">
            <div className="p-4 space-y-2">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                Produits ({projectDeliverables.length})
              </h3>
              {projectDeliverables.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-6">Aucun produit dans ce projet</p>
              ) : (
                <div className="space-y-1">
                  {projectDeliverables.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                      <div className={`w-1.5 h-1.5 rounded-full ${BILLING_STATUS_DOT[d.billingStatus]}`} />
                      <span className="text-xs font-medium text-[var(--text-primary)] truncate flex-1">{d.name}</span>
                      {d.prixFacturé != null && d.prixFacturé > 0 && (
                        <span className="text-[10px] font-semibold text-[#22c55e]">{formatEuro(d.prixFacturé)}</span>
                      )}
                      <span className="text-[9px] text-[var(--text-muted)]">{BILLING_STATUS_LABEL[d.billingStatus]}</span>
                      {d.totalInvoiced != null && d.totalInvoiced > 0 && (
                        <span className="text-[9px] font-medium text-[var(--accent-cyan)]">{formatEuro(d.totalInvoiced)} facturé</span>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)] mt-2 px-2.5">
                    <span>Total facturé produits</span>
                    <span className="font-semibold text-[var(--accent-cyan)]">{formatEuro(billing.totalProductInvoiced)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 space-y-3">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Facturation projet</h3>
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Devis global</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input type="number" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} placeholder="Montant"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/40 focus:outline-none focus:border-[var(--accent-cyan)]" />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]">€</span>
                  </div>
                  <DateInput value={quoteDate} onChange={setQuoteDate} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Acompte</label>
                  {quoteAmount && parseFloat(quoteAmount) > 0 && (
                    <button type="button" onClick={() => setDepositAmount(String(Math.round(parseFloat(quoteAmount) * 0.3)))}
                      className="text-[10px] font-semibold text-[var(--accent-cyan)] hover:underline cursor-pointer">30%</button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="Montant"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/40 focus:outline-none focus:border-[var(--accent-cyan)]" />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]">€</span>
                  </div>
                  <DateInput value={depositDate} onChange={setDepositDate} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Avancements</label>
                  <button type="button" onClick={addProgressRow} className="text-[10px] text-[var(--accent-cyan)] hover:underline cursor-pointer">+ Ajouter</button>
                </div>
                {progressAmounts.map((amt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input type="number" value={amt} onChange={(e) => { const c = [...progressAmounts]; c[idx] = e.target.value; setProgressAmounts(c); }} placeholder="Montant"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/40 focus:outline-none focus:border-[var(--accent-cyan)]" />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]">€</span>
                    </div>
                    <DateInput value={progressDates[idx] || ''} onChange={(v) => { const c = [...progressDates]; c[idx] = v; setProgressDates(c); }} />
                    <button type="button" onClick={() => removeProgressRow(idx)} className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 cursor-pointer flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
              {billing.remaining <= 0.01 && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Date solde</label>
                  <DateInput value={balanceDate} onChange={setBalanceDate} />
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] space-y-1.5">
                <div className="flex justify-between text-[10px]"><span className="text-[var(--text-muted)]">Paiements projet</span><span className="font-medium text-[var(--text-primary)]">{formatEuro(billing.totalProjectPayments)}</span></div>
                <div className="flex justify-between text-[10px]"><span className="text-[var(--text-muted)]">Facturé produits</span><span className="font-medium text-[var(--accent-cyan)]">{formatEuro(billing.totalProductInvoiced)}</span></div>
                <div className="flex justify-between text-xs font-semibold pt-1 border-t border-dashed border-[var(--border-subtle)]">
                  <span className="text-[var(--text-primary)]">Total payé</span>
                  <span className={overBudget ? 'text-red-400' : 'text-[#22c55e]'}>{formatEuro(billing.totalPaid)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
