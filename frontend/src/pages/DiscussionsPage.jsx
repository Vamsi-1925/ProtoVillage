import React, { useEffect, useState } from "react";
import AppShell from "@/components/graamam/AppShell";
import PageHeader from "@/components/graamam/PageHeader";
import Icon from "@/components/graamam/Icon";
import { formatTimeAgo } from "@/lib/formatters";

const API = ((typeof process !== "undefined" && process.env && process.env.REACT_APP_BACKEND_URL) || "") + "/api";

export default function DiscussionsPage() {
  const [threads, setThreads] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const loadThreads = async () => setThreads(await fetch(`${API}/graamam/threads`).then(r => r.json()));
  useEffect(() => { loadThreads(); }, []);

  useEffect(() => {
    if (!active) return setMessages([]);
    fetch(`${API}/graamam/threads/${active}/messages`).then(r => r.json()).then(setMessages);
  }, [active]);

  const createThread = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const t = await fetch(`${API}/graamam/threads`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), link_type: "general", created_by: "Aditi R." }),
    }).then(r => r.json());
    setNewTitle("");
    await loadThreads();
    setActive(t.thread_id);
  };

  const post = async () => {
    if (!msg.trim() || !active) return;
    await fetch(`${API}/graamam/threads/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id: active, body: msg.trim(), author: "Aditi R." }),
    });
    setMsg("");
    setMessages(await fetch(`${API}/graamam/threads/${active}/messages`).then(r => r.json()));
  };

  return (
    <AppShell topBarTitle="Discussions">
      <div data-testid="graamam-discussions-page">
        <PageHeader title="Discussions" subtitle="Threaded conversations attached to Orders, Batches, Production Tokens, and PRs." />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[560px]">
          <aside className="lg:col-span-1 rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm-sm p-4 flex flex-col">
            <form onSubmit={createThread} className="flex items-stretch gap-2 mb-3">
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="New discussion title…" className="flex-1 font-body text-body-sm rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
              <button type="submit" className="font-label font-bold text-body-sm px-3 py-2 rounded-lg bg-primary-container text-on-primary"><Icon name="add" className="text-[16px]" /></button>
            </form>
            <div className="flex-1 overflow-y-auto">
              {threads.length === 0 ? (
                <div className="text-outline text-body-sm text-center py-8">No discussions yet. Start one!</div>
              ) : threads.map((t) => (
                <button key={t.thread_id} onClick={() => setActive(t.thread_id)} className={[
                  "w-full text-left rounded-xl p-3 border transition-colors mb-2",
                  active === t.thread_id ? "border-primary-container bg-primary-fixed/30 dark:bg-white/5" : "border-transparent hover:bg-surface-container-low dark:hover:bg-white/5",
                ].join(" ")}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-label font-bold text-body-md text-on-surface dark:text-white truncate">{t.title}</div>
                    {t.status === "closed" ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-outline uppercase">closed</span> : null}
                  </div>
                  <div className="text-body-sm text-outline truncate mt-0.5">{t.last_message?.body || "No messages yet."}</div>
                  <div className="text-[11px] text-outline mt-1">{formatTimeAgo(t.updated_at)}</div>
                </button>
              ))}
            </div>
          </aside>

          <section className="lg:col-span-2 rounded-2xl bg-surface-container-lowest dark:bg-[#121212] border border-surface-variant/70 dark:border-white/5 shadow-warm p-6 flex flex-col">
            {!active ? (
              <div className="flex-1 flex flex-col items-center justify-center text-outline text-center gap-2">
                <Icon name="forum" className="text-[36px]" />
                <div className="font-headline text-headline-sm text-on-surface dark:text-white">Pick a thread</div>
                <p className="text-body-sm max-w-md">Or start a new discussion from the left panel.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-4">
                  {messages.length === 0 ? <div className="text-outline text-body-sm text-center py-8">Say hi to start the conversation.</div> : messages.map((m) => (
                    <div key={m.id} className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary-container flex items-center justify-center text-body-sm font-bold">{m.author?.slice(0, 2).toUpperCase() || "?"}</div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2"><span className="font-label font-bold text-on-surface dark:text-white">{m.author}</span><span className="text-[11px] text-outline">{formatTimeAgo(m.created_at)}</span></div>
                        <div className="text-body-md text-on-surface dark:text-white mt-0.5 whitespace-pre-wrap">{m.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-stretch gap-2">
                  <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && post()} placeholder="Write a message…" className="flex-1 font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />
                  <button onClick={post} className="font-label font-bold text-body-md px-5 py-2.5 rounded-lg bg-primary-container text-on-primary shadow-warm-sm inline-flex items-center gap-2"><Icon name="send" className="text-[18px]" /> Send</button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
