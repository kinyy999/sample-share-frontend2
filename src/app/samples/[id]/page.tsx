"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

type UserRef = { _id?: string; username?: string; email?: string };
type Comment = { _id: string; user: UserRef; text: string; createdAt?: string };
type Sample = {
  _id: string;
  title: string;
  bpm?: number;
  key?: string;
  genre?: string;
  url?: string;
  artist?: string;
  tags?: string[];
  description?: string;
  isPublic?: boolean;
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
  comments?: Comment[];
};

// מזהה המשתמש המחובר
type Me = { id: string | null; role: string | null };

function readTokenPayload() {
  const t = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (!t) return null;
  try {
    return JSON.parse(atob(t.split(".")[1]));
  } catch {
    return null;
  }
}

export default function SampleDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [sample, setSample] = useState<Sample | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // add–comment state
  const [authed, setAuthed] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [postOk, setPostOk] = useState<string | null>(null);

  // --- comment edit state ---
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [me, setMe] = useState<Me>({ id: null, role: null });

  useEffect(() => {
    const p = readTokenPayload();
    setMe({ id: p?.userId ?? null, role: p?.role ?? null });
  }, []);

  // נתחיל עריכה
  function startEdit(c: any) {
    setEditingCommentId(c._id);
    setEditText(c.text || "");
  }

  // ביטול עריכה
  function cancelEdit() {
    setEditingCommentId(null);
    setEditText("");
  }

  // שמירת עריכה
  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCommentId) return;

    const token = localStorage.getItem("auth_token");
    if (!token) {
      setPostError("You must log in first");
      return;
    }

    const text = editText.trim();
    if (!text) {
      setPostError("תוכן התגובה לא יכול להיות ריק");
      return;
    }

    try {
      setPosting(true);
      setPostError(null);

      const res = await fetch(`${API_BASE}/samples/${id}/comments/${editingCommentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Update failed (${res.status})`);

      // רענון לוקאלי מהיר (בלי פetch מלא):
      setSample((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: (prev.comments || []).map((c: any) =>
            c._id === editingCommentId ? { ...c, text } : c
          ),
        } as any;
      });

      setEditingCommentId(null);
      setEditText("");
    } catch (err: any) {
      setPostError(err?.message || "Network error");
    } finally {
      setPosting(false);
    }
  }

  function canDeleteComment(c: { user?: { _id?: string } }) {
    return me.role === "admin" || (c.user?._id && c.user._id === me.id);
  }

  async function onDeleteComment(cid: string) {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setPostError("You must log in first");
      return;
    }
    if (!confirm("Delete this comment?")) return;

    setDeletingCommentId(cid);
    try {
      const res = await fetch(`${API_BASE}/samples/${id}/comments/${cid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Delete failed (${res.status})`);

      // עדכון מקומי של הרשימה בלי רענון עמוד
      setSample((prev) =>
        prev ? { ...prev, comments: (prev.comments || []).filter((c: any) => c._id !== cid) } : prev
      );
    } catch (e: any) {
      setPostError(e?.message || "Network error");
    } finally {
      setDeletingCommentId(null);
    }
  }

  // טוען דגימה + תגובות (ללא טוקן)
  useEffect(() => {
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/samples/${id}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `Failed to load sample (${res.status})`);
        setSample(data as Sample);
      } catch (e: any) {
        setError(e?.message || "Network error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // בודק אם יש טוקן עבור טופס התגובה
  useEffect(() => {
    setAuthed(!!localStorage.getItem("auth_token"));
  }, []);

  async function onAddComment(e: React.FormEvent) {
    e.preventDefault();
    setPostError(null);
    setPostOk(null);

    const text = commentText.trim();
    if (!text) {
      setPostError("תגובה לא יכולה להיות ריקה");
      return;
    }

    const token = localStorage.getItem("auth_token");
    if (!token) {
      // צריך להתחבר כדי להגיב
      router.push("/login");
      return;
    }

    setPosting(true);
    try {
      const res = await fetch(`${API_BASE}/samples/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_role");
        setPostError("Session expired. Please log in again.");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || `Failed to add comment (${res.status})`);
      }

      const updated = (data?.sample ?? null) as Sample | null;
      if (updated) setSample(updated);
      setCommentText("");
      setPostOk("התגובה נוספה ✔");
    } catch (err: any) {
      setPostError(err?.message || "Network error");
    } finally {
      setPosting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black px-4 py-6 md:px-6">
      <div className="mx-auto w-full max-w-5xl">
        {/* top bar */}
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-300/80">SampleShare</p>
            <h1 className="text-2xl font-bold text-white">Sample details</h1>
          </div>
          <button
            onClick={() => router.push("/samples")}
            className="rounded-md border border-slate-500/70 bg-slate-900/40 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-800/80 transition"
          >
            ← Back
          </button>
        </header>

        {/* hero / cover */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-700/80 bg-[radial-gradient(circle_at_top,_#38bdf8_0,_#0f172a_55%,_#020617_100%)]">
          <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-200/80">Previewing sample</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                {sample?.title ?? "Unknown sample"}
              </h2>
              <p className="mt-2 text-sm text-slate-200/75 max-w-2xl">
                Manage comments, metadata and visibility for this sample.
              </p>
            </div>
            {/* decorative image box */}
            <div className="h-28 w-full max-w-xs rounded-xl bg-slate-950/40 border border-slate-500/40 backdrop-blur flex items-center justify-center text-slate-200/70 text-xs tracking-wide">
              {sample?.genre ? (
                <div className="text-center">
                  <p className="text-[0.65rem] uppercase text-slate-300/80">Genre</p>
                  <p className="text-lg font-semibold text-white">{sample.genre}</p>
                  {sample.bpm !== undefined && (
                    <p className="mt-2 text-xs text-slate-200/80">BPM {sample.bpm}</p>
                  )}
                </div>
              ) : (
                <span>Sample artwork</span>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-4 text-slate-100">
            Loading…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-400/50 bg-red-950/40 p-4 text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && sample && (
          <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
            {/* left: info + comments */}
            <div className="space-y-6">
              {/* פרטים בסיסיים */}
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/40 p-5 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{sample.title}</h2>
                    <p className="mt-1 text-sm text-slate-300/85">
                      {sample.bpm !== undefined && (
                        <>
                          BPM:{" "}
                          <span className="text-white font-medium">{sample.bpm}</span> ·{" "}
                        </>
                      )}
                      {sample.key && (
                        <>
                          Key: <span className="text-white font-medium">{sample.key}</span> ·{" "}
                        </>
                      )}
                      {sample.genre && (
                        <>
                          Genre: <span className="text-white font-medium">{sample.genre}</span>
                        </>
                      )}
                    </p>
                    {sample.artist && (
                      <p className="mt-2 text-sm text-slate-200/85">Artist: {sample.artist}</p>
                    )}
                  </div>

                  {sample.url && (
                    <a
                      href={sample.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 rounded-md bg-slate-100/95 px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-white transition"
                    >
                      Open URL
                      <span aria-hidden>↗</span>
                    </a>
                  )}
                </div>

                {sample.tags && sample.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {sample.tags.map((t, i) => (
                      <span
                        key={`tag-${i}`}
                        className="rounded-full border border-slate-500/60 bg-slate-950/30 px-2 py-0.5 text-xs text-slate-200/90"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {sample.description && (
                  <p className="mt-4 text-sm text-slate-100/85 whitespace-pre-wrap leading-relaxed">
                    {sample.description}
                  </p>
                )}

                {/* טופס עריכה קטן — מוצג רק לבעלים או אדמין */}
                {(me?.role === "admin" || (me?.id && sample?.owner === me.id)) && (
                  <details className="mt-5 overflow-hidden rounded-md border border-slate-600/60 bg-slate-950/40">
                    <summary className="cursor-pointer select-none px-3 py-2 text-sm text-slate-100 hover:bg-slate-900/70">
                      Edit sample
                    </summary>

                    <form
                      className="p-3 grid grid-cols-1 gap-3 md:grid-cols-2"
                      onSubmit={async (e) => {
                        e.preventDefault();

                        const token = localStorage.getItem("auth_token");
                        if (!token) {
                          router.push("/login");
                          return;
                        }

                        const fd = new FormData(e.currentTarget);

                        try {
                          const res = await fetch(`${API_BASE}/samples/${id}`, {
                            method: "PUT",
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                            body: fd,
                          });

                          if (res.status === 401 || res.status === 403) {
                            localStorage.removeItem("auth_token");
                            localStorage.removeItem("auth_role");
                            router.push("/login");
                            return;
                          }

                          const data = await res.json().catch(() => ({}));
                          if (!res.ok) {
                            alert(data?.error || `Update failed (${res.status})`);
                            return;
                          }

                          setSample(data);
                          alert("Changes updated successfully ✔");
                        } catch (err: any) {
                          alert(err?.message || "Network error");
                        }
                      }}
                    >
                      <input
                        name="title"
                        defaultValue={sample.title ?? ""}
                        placeholder="Title*"
                        className="rounded-md border border-slate-500 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400"
                        required
                      />
                      <input
                        name="bpm"
                        defaultValue={sample.bpm ?? ""}
                        placeholder="bpm"
                        className="rounded-md border border-slate-500 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400"
                        inputMode="numeric"
                      />
                      <input
                        name="key"
                        defaultValue={sample.key ?? ""}
                        placeholder="Key (e.g Am)"
                        className="rounded-md border border-slate-500 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400"
                      />
                      <input
                        name="genre"
                        defaultValue={sample.genre ?? ""}
                        placeholder="Genre"
                        className="rounded-md border border-slate-500 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400"
                      />
                      <input
                        name="url"
                        defaultValue={sample.url ?? ""}
                        placeholder="URL"
                        className="rounded-md border border-slate-500 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400"
                      />

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm text-slate-200/85">
                          Replace audio (optional)
                        </label>
                        <input
                          type="file"
                          name="audio"
                          accept="audio/*"
                          className="block w-full rounded-md border border-slate-500 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-1 file:text-sm file:font-medium file:text-slate-900"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <button className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-white transition">
                          Save
                        </button>
                      </div>
                    </form>
                  </details>
                )}
              </div>

              {/* תגובות */}
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/40 p-5 backdrop-blur">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-md font-semibold text-white">תגובות</h3>
                  {sample?.comments?.length ? (
                    <span className="rounded-full bg-slate-800/70 px-3 py-1 text-xs text-slate-200/80">
                      {sample.comments.length} comments
                    </span>
                  ) : null}
                </div>

                {sample?.comments?.length ? (
                  <ul className="mb-4 space-y-3">
                    {sample.comments.map((c) => (
                      <li
                        key={c._id}
                        className="rounded-lg border border-slate-700/60 bg-slate-950/30 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm text-slate-200">
                            <span className="font-medium">
                              {c.user?.username || c.user?.email || "Unknown"}
                            </span>
                            {c.createdAt && (
                              <span className="ml-2 text-xs text-slate-400">
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {canDeleteComment(c) && editingCommentId !== c._id && (
                              <button
                                onClick={() => startEdit(c)}
                                className="rounded border border-slate-500/60 px-2 py-0.5 text-xs text-slate-100 hover:bg-slate-800/70"
                                title="Edit comment"
                              >
                                Edit
                              </button>
                            )}

                            {canDeleteComment(c) && (
                              <button
                                onClick={() => onDeleteComment(c._id)}
                                disabled={deletingCommentId === c._id}
                                className="rounded border border-red-500/70 px-2 py-0.5 text-xs text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                                title="Delete comment"
                              >
                                {deletingCommentId === c._id ? "Deleting…" : "Delete"}
                              </button>
                            )}
                          </div>
                        </div>

                        {editingCommentId === c._id ? (
                          <form onSubmit={saveEdit} className="mt-2 space-y-2">
                            <textarea
                              className="w-full rounded-md border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-slate-100"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={3}
                              autoFocus
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="submit"
                                disabled={posting}
                                className="rounded bg-slate-100 px-3 py-1 text-sm font-medium text-slate-900 hover:bg-white transition disabled:opacity-70"
                              >
                                {posting ? "Saving…" : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-100 hover:bg-slate-800/60"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="mt-2 text-sm text-slate-100">{c.text}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mb-4 rounded-md border border-slate-700/50 bg-slate-950/30 p-3 text-sm text-slate-200">
                    אין תגובות עדיין.
                  </div>
                )}

                {/* טופס הוספת תגובה */}
                {authed ? (
                  <form onSubmit={onAddComment} className="space-y-2">
                    <textarea
                      className="w-full rounded-md border border-slate-700 bg-slate-950/20 p-2 text-sm text-slate-100 placeholder:text-slate-500"
                      placeholder="כתוב/כתבי תגובה…"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={3}
                    />
                    <div className="flex items-center gap-3">
                      <button
                        disabled={posting || commentText.trim().length === 0}
                        className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-white transition disabled:opacity-40"
                      >
                        {posting ? "שולח…" : "הוסף תגובה"}
                      </button>
                      {postOk && <span className="text-xs text-green-300">{postOk}</span>}
                      {postError && <span className="text-xs text-red-300">{postError}</span>}
                    </div>
                  </form>
                ) : (
                  <div className="rounded-md border border-amber-300/40 bg-amber-900/20 p-3 text-sm text-amber-50">
                    כדי להוסיף תגובה יש להתחבר.{" "}
                    <button
                      onClick={() => router.push("/login")}
                      className="underline decoration-dotted underline-offset-2 hover:opacity-90"
                    >
                      התחברות
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* right side: meta */}
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-700/70 bg-slate-950/30 p-4">
                <h4 className="text-sm font-semibold text-slate-100 mb-3">Meta</h4>
                <div className="space-y-2 text-sm text-slate-200/85">
                  <p>
                    <span className="text-slate-400">ID:</span> {sample._id}
                  </p>
                  {sample.createdAt && (
                    <p>
                      <span className="text-slate-400">Created:</span>{" "}
                      {new Date(sample.createdAt).toLocaleString()}
                    </p>
                  )}
                  {sample.updatedAt && (
                    <p>
                      <span className="text-slate-400">Updated:</span>{" "}
                      {new Date(sample.updatedAt).toLocaleString()}
                    </p>
                  )}
                  <p>
                    <span className="text-slate-400">Visibility:</span>{" "}
                    {sample.isPublic ? "Public" : "Private"}
                  </p>
                  {sample.owner && (
                    <p>
                      <span className="text-slate-400">Owner:</span> {sample.owner}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-700/70 bg-slate-950/30 p-4">
                <h4 className="text-sm font-semibold text-slate-100 mb-3">
                  Quick tips
                </h4>
                <ul className="space-y-2 text-sm text-slate-200/80">
                  <li>• ניתן לערוך תגובות רק אם אתה הבעלים או אדמין.</li>
                  <li>• העלאת אודיו חדש מחליפה את הקובץ הקיים.</li>
                  <li>• תגובות נשמרות מיידית בריענון.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
