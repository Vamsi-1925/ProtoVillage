import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import Icon from "@/components/graamam/Icon";
import StatusPill from "@/components/graamam/StatusPill";
import { productionRepository } from "@/lib/firestoreClient";
import { GRAAMAM_PRODUCTION } from "@/constants/testIds";
import { formatDateTimeIST, formatQty } from "@/lib/formatters";

/**
 * ProductionPage — graamam_v2 pgProduction parity: PROD tokens raised by
 * the Warehouse stock-check (short on finished goods). Create Slip
 * aggregates raw-material requirement from the linked order via each
 * product's recipe; all sufficient -> Start Production (deducts raw
 * materials); short -> a PROC token is raised automatically and the order
 * heads to Procurement. Mark Complete adds produced qty to finished stock.
 */
function TypeBadge({ type }) {
  if (!type) return null;
  const isB2B = type === "b2b";
  return (
    <span className={["inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-label font-bold uppercase tracking-wide",
      isB2B ? "bg-secondary-container text-on-secondary-container" : "bg-tertiary-fixed-dim text-on-tertiary-fixed"].join(" ")}>
      {type.toUpperCase()}
    </span>
  );
}

function TokenCard({ token, onCreateSlip, onViewSlip, onStart, onComplete, onSendToProc, busy }) {
  const order = token.order;
  const hasSlip = !!token.slip_id;
  const shortage = token.shortage;
  return (
    <article data-testid={GRAAMAM_PRODUCTION.tokenCard(token.token_id)} className={["rounded-2xl border p-5 shadow-warm-sm bg-surface-container-lowest dark:bg-[#121212]",
      shortage ? "border-terracotta-error/40" : "border-surface-variant/70 dark:border-white/5"].join(" ")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-mono text-sm bg-surface-container dark:bg-white/10 px-2.5 py-1 rounded-md text-on-surface dark:text-white font-semibold border border-outline-variant/30 dark:border-white/10">
              {token.token_id}
            </span>
            <span className="text-outline text-[11px]">linked to</span>
            <span className="font-mono text-sm text-on-surface-variant dark:text-outline-variant">{token.order_id}</span>
            {order ? <TypeBadge type={order.order_type} /> : null}
            <StatusPill status={token.status === "in_progress" ? "production_active" : "production_pending"} />
          </div>
          <div className="font-headline font-bold text-body-lg text-on-surface dark:text-white">{order?.customer?.name || "Unknown"}</div>
          <div className="text-body-sm text-on-surface-variant dark:text-outline-variant mt-0.5">
            {order?.items_summary || token.product_name} · {formatQty(token.product_qty, token.product_unit)}
          </div>
          <div className="text-[11px] text-outline mt-1.5">Raised {formatDateTimeIST(token.created_at)}</div>
          {shortage ? (
            <div className="mt-2 inline-flex items-center gap-1.5 text-terracotta-error text-body-sm font-label font-bold">
              <Icon name="warning" className="text-[16px]" /> Material shortage — Procurement raised
            </div>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {!hasSlip ? (
            <button type="button" disabled={busy} data-testid={GRAAMAM_PRODUCTION.createSlipButton(token.token_id)} onClick={() => onCreateSlip(token.token_id)}
              className="font-label font-bold text-body-sm px-4 py-2 rounded-lg bg-primary-container text-on-primary shadow-warm-sm inline-flex items-center gap-2 disabled:opacity-60">
              <Icon name="description" className="text-[16px]" /> Create Production Slip
            </button>
          ) : (
            <>
              <button type="button" data-testid={GRAAMAM_PRODUCTION.viewSlipButton(token.token_id)} onClick={() => onViewSlip(token.token_id)}
                className="font-label font-bold text-body-sm px-4 py-2 rounded-lg bg-surface-container dark:bg-white/5 border border-outline-variant/70 dark:border-white/10 text-on-surface dark:text-white hover:bg-surface-container-high inline-flex items-center gap-2">
                <Icon name="visibility" className="text-[16px]" /> View Slip
              </button>
              {token.status === "open" && !shortage ? (
                <button type="button" disabled={busy} data-testid={GRAAMAM_PRODUCTION.startButton(token.token_id)} onClick={() => onStart(token.token_id)}
                  className="font-label font-bold text-body-sm px-4 py-2 rounded-lg bg-olive-success text-white shadow-warm-sm inline-flex items-center gap-2 disabled:opacity-60">
                  <Icon name="play_arrow" className="text-[16px]" /> Start Production
                </button>
              ) : token.status === "open" && shortage ? (
                <button type="button" data-testid={GRAAMAM_PRODUCTION.sendToProcButton(token.token_id)} onClick={() => onSendToProc(token.token_id)}
                  className="font-label font-bold text-body-sm px-4 py-2 rounded-lg bg-tertiary-fixed-dim text-on-tertiary-fixed shadow-warm-sm inline-flex items-center gap-2">
                  <Icon name="inventory_2" className="text-[16px]" /> Restock in Inventory
                </button>
              ) : token.status === "in_progress" ? (
                <button type="button" disabled={busy} data-testid={GRAAMAM_PRODUCTION.completeButton(token.token_id)} onClick={() => onComplete(token.token_id)}
                  className="font-label font-bold text-body-sm px-4 py-2 rounded-lg bg-olive-success text-white shadow-warm-sm inline-flex items-center gap-2 disabled:opacity-60">
                  <Icon name="check_circle" className="text-[16px]" /> Mark Complete
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function SlipDialog({ tokenId, onClose }) {
  const [slip, setSlip] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tokenId) return;
    productionRepository.slip(tokenId).then(setSlip).catch((e) => setError(e.message));
  }, [tokenId]);

  if (!tokenId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" data-testid={GRAAMAM_PRODUCTION.slipDialog} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-inverse-surface/60 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-outline-variant/60 dark:border-white/10 shadow-warm-lg p-8">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h3 className="font-headline font-bold text-headline-md text-on-surface dark:text-white">Production Slip</h3>
            <p className="font-mono text-body-sm text-on-surface-variant dark:text-outline-variant mt-1">{slip?.slip_id || tokenId}</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="text-outline hover:text-primary-container dark:hover:text-white p-2 -m-2 rounded-full transition-colors">
            <Icon name="close" className="text-[22px]" />
          </button>
        </div>
        {error ? (
          <div className="text-error text-body-md py-6 text-center">{error}</div>
        ) : !slip ? (
          <div className="text-outline text-body-md py-6 text-center">Loading…</div>
        ) : (
          <>
            <div className={`mb-4 rounded-xl px-4 py-3 text-body-sm font-label font-bold flex items-center gap-2 ${slip.all_ok ? "bg-olive-success/10 text-olive-success" : "bg-terracotta-error/10 text-terracotta-error"}`}>
              <Icon name={slip.all_ok ? "check_circle" : "warning"} className="text-[18px]" />
              {slip.all_ok ? "All raw materials available" : "Material shortage — Procurement required"}
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-outline uppercase text-label-sm tracking-wider border-b border-surface-variant/70 dark:border-white/10">
                  <th className="py-2 pr-4">Material</th>
                  <th className="py-2 pr-4">Required</th>
                  <th className="py-2 pr-4">Available</th>
                  <th className="py-2">✓/✗</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/70 dark:divide-white/10">
                {(slip.recipe || []).map((r, i) => (
                  <tr key={i}>
                    <td className="py-2.5 pr-4 font-semibold text-on-surface dark:text-white">{r.mat_name}</td>
                    <td className="py-2.5 pr-4 text-on-surface-variant dark:text-outline-variant">{formatQty(r.required, r.unit)}</td>
                    <td className={`py-2.5 pr-4 font-semibold ${r.sufficient ? "text-on-surface dark:text-white" : "text-terracotta-error"}`}>{formatQty(r.available, r.unit)}</td>
                    <td className="py-2.5">
                      <Icon name={r.sufficient ? "check_circle" : "cancel"} className={`text-[18px] ${r.sufficient ? "text-olive-success" : "text-terracotta-error"}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

export default function ProductionPage() {
  const [tokens, setTokens] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [slipToken, setSlipToken] = useState(null);
  const nav = useNavigate();

  const load = useCallback(async () => {
    try {
      const all = await productionRepository.list();
      const list = Array.isArray(all) ? all : [];
      setTokens(list.filter((t) => t.status === "open" || t.status === "in_progress"));
      setCompleted(list.filter((t) => t.status === "complete"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreateSlip = async (tokenId) => {
    setBusyId(tokenId);
    try { await productionRepository.createSlip(tokenId); await load(); }
    catch (e) { alert(`Could not create slip: ${e.message}`); }
    finally { setBusyId(null); }
  };
  const handleStart = async (tokenId) => {
    setBusyId(tokenId);
    try { await productionRepository.start(tokenId); await load(); }
    catch (e) { alert(`Could not start production: ${e.message}`); }
    finally { setBusyId(null); }
  };
  const handleComplete = async (tokenId) => {
    setBusyId(tokenId);
    try { await productionRepository.complete(tokenId); await load(); }
    catch (e) { alert(`Could not mark complete: ${e.message}`); }
    finally { setBusyId(null); }
  };

  return (
    <AppShell topBarTitle="Production">
      <div data-testid={GRAAMAM_PRODUCTION.page}>
        <PageHeader title="Production" subtitle="Raw-material availability, production slips, and completions. Linked to the order pipeline." />

        <div data-testid={GRAAMAM_PRODUCTION.activeSection} className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm p-6 mb-8">
          <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white mb-4">Active Production Tokens ({tokens.length})</h3>
          {loading ? (
            <div className="py-10 text-center text-on-surface-variant dark:text-outline-variant font-body text-body-md">Loading…</div>
          ) : tokens.length === 0 ? (
            <div data-testid={GRAAMAM_PRODUCTION.activeEmpty} className="py-10 text-center text-outline flex flex-col items-center gap-2">
              <Icon name="settings" className="text-[28px]" />
              <span className="font-body text-body-md">No active production tokens.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {tokens.map((t) => (
                <TokenCard
                  key={t.token_id} token={t} busy={busyId === t.token_id}
                  onCreateSlip={handleCreateSlip} onViewSlip={setSlipToken}
                  onStart={handleStart} onComplete={handleComplete}
                  onSendToProc={() => nav("/inventory")}
                />
              ))}
            </div>
          )}
        </div>

        <div data-testid={GRAAMAM_PRODUCTION.completedSection} className="rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-variant dark:border-white/10">
            <h3 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white">Completed ({completed.length})</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-outline uppercase text-label-sm tracking-wider">
                <th className="py-3 px-6">PROD Token</th>
                <th className="py-3 px-6">Order</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Product</th>
                <th className="py-3 px-6">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/70 dark:divide-white/5">
              {completed.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-outline">No completed production tokens yet.</td></tr>
              ) : completed.map((t) => (
                <tr key={t.token_id}>
                  <td className="py-3 px-6 font-mono text-sm text-on-surface dark:text-white">{t.token_id}</td>
                  <td className="py-3 px-6 font-mono text-sm text-on-surface-variant dark:text-outline-variant">{t.order_id}</td>
                  <td className="py-3 px-6 font-semibold text-on-surface dark:text-white">{t.order?.customer?.name || "-"}</td>
                  <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant">{t.order?.items_summary || t.product_name}</td>
                  <td className="py-3 px-6 text-on-surface-variant dark:text-outline-variant whitespace-nowrap">{formatDateTimeIST(t.completed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <SlipDialog tokenId={slipToken} onClose={() => setSlipToken(null)} />
    </AppShell>
  );
}
