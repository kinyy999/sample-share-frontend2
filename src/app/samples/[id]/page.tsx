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
    const t = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!t) return null;
  try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; }
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
    return me.role === 'admin' || (c.user?._id && c.user._id === me.id);
  }

  async function onDeleteComment(cid: string) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setPostError('You must log in first');
      return;
    }
    if (!confirm('Delete this comment?')) return;

    setDeletingCommentId(cid);
    try {
      const res = await fetch(`${API_BASE}/samples/${id}/comments/${cid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Delete failed (${res.status})`);

      // עדכון מקומי של הרשימה בלי רענון עמוד
      setSample((prev) =>
        prev ? { ...prev, comments: (prev.comments || []).filter((c: any) => c._id !== cid) } : prev
      );
    } catch (e: any) {
      setPostError(e?.message || 'Network error');
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

      // השרת מחזיר { message, sample } — נעדכן את המסך
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
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">Sample details</h1>
          <button
            onClick={() => router.push("/samples")}
            className="text-black rounded-md border border-gray-600 px-3 py-1.5 text-sm hover:bg-gray-200"
          >
            ← Back
          </button>
        </header>

        {loading && <div className="rounded-md border border-gray-600 bg-white p-4">Loading…</div>}

        {!loading && error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        )}

        {!loading && !error && sample && (
          <div className="space-y-6">
            {/* פרטים בסיסיים */}
            <div className="rounded-lg border border-gray-600 bg-white p-4">
              <h2 className="text-lg font-semibold text-black">{sample.title}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {sample.bpm !== undefined && (
                  <>
                    BPM: <span className="text-black font-medium">{sample.bpm}</span> ·{" "}
                  </>
                )}
                {sample.key && (
                  <>
                    Key: <span className="text-black font-medium">{sample.key}</span> ·{" "}
                  </>
                )}
                {sample.genre && (
                  <>
                    Genre: <span className="text-black font-medium">{sample.genre}</span>
                  </>
                )}
              </p>

              {sample.artist && <p className="mt-1 text-sm text-gray-700">Artist: {sample.artist}</p>}

              {sample.url && (
                <a
                  href={sample.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-black mt-3 inline-flex items-center rounded-md border border-gray-600 px-3 py-1.5 text-sm hover:bg-gray-200"
                >
                  Open URL
                </a>
              )}

              {sample.tags && sample.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {sample.tags.map((t, i) => (
                    <span
                      key={`tag-${i}`}
                      className="rounded-full border border-gray-600 px-2 py-0.5 text-xs text-gray-700"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {sample.description && (
                <p className="mt-3 text-sm text-gray-800 whitespace-pre-wrap">{sample.description}</p>
              )}

              {/* טופס עריכה קטן — מוצג רק לבעלים או אדמין */}
              {(me?.role === 'admin' || (me?.id && sample?.owner === me.id)) && (
               <details className="mt-4 rounded-md border border-gray-600">
                 <summary className="cursor-pointer select-none px-3 py-2 text-sm text-black hover:bg-gray-50">
                   Edit sample
                 </summary>

                <form
                  className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const token = localStorage.getItem('auth_token');
                    if (!token) { router.push('/login'); return; }

                    const fd = new FormData(e.currentTarget);
                    const payload: any = {
                      title: (fd.get('title') as string)?.trim(),
                      bpm: fd.get('bpm') ? Number(fd.get('bpm')) : undefined,
                      key: (fd.get('key') as string)?.trim(),
                      genre: (fd.get('genre') as string)?.trim(),
                      url: (fd.get('url') as string)?.trim() || undefined,
                   };

                   try {
                      const res = await fetch(`${API_BASE}/samples/${id}`, {
                       method: 'PUT',
                       headers: {
                         'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(payload),
                      });

                      // טוקן פג / אין הרשאה → ניקוי והפניה
                      if (res.status === 401 || res.status === 403) {
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('auth_role');
                        router.push('/login');
                       return;
                     }

                     const data = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        alert(data?.error || `Update failed (${res.status})`);
                        return;
                      }

                      // עדכון המסך מיד + איפוס הטופס
                      setSample(data);                      
                    } catch (err: any) {
                      alert(err?.message || 'Network error');
                    }
                  }}
                >
                  <input name="title" defaultValue={sample.title ?? ''} placeholder="Title *"
                         className="text-gray-600 rounded-md border border-gray-600 px-3 py-2" required />
                  <input name="bpm" defaultValue={sample.bpm ?? ''} placeholder="BPM"
                         className="text-gray-600 rounded-md border border-gray-600 px-3 py-2" inputMode="numeric" />
                  <input name="key" defaultValue={sample.key ?? ''} placeholder="Key (e.g. Am)"
                         className="text-gray-600 rounded-md border border-gray-600 px-3 py-2" />
                  <input name="genre" defaultValue={sample.genre ?? ''} placeholder="Genre"
                         className="text-gray-600 rounded-md border border-gray-600 px-3 py-2" />
                  <input name="url" defaultValue={sample.url ?? ''} placeholder="URL (optional)"
                         className="md:col-span-2 text-gray-600 rounded-md border border-gray-600 px-3 py-2" />

                  <div className="md:col-span-2">
                    <button className="text-gray-600 rounded-md border border-gray-600 px-3 py-1.5 text-sm hover:bg-blue-200">
                      Save
                    </button>
                  </div>
                </form>
              </details>
            )}




            </div>

            {/* תגובות */}
            <div className="rounded-lg border border-gray-600 bg-white p-4">
              <h3 className="text-md font-semibold text-black mb-3">תגובות</h3>

              {sample?.comments?.length ? (
              <ul className="space-y-2 mb-4">
                {sample.comments.map((c) => (
                  <li key={c._id} className="rounded-md border border-gray-600 p-3">
                    <div className="flex items-start justify-between">
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">
                          {c.user?.username || c.user?.email || "Unknown"}
                        </span>
                        {c.createdAt && (
                          <span className="ml-2 text-gray-500">
                            {new Date(c.createdAt).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Edit – רק Owner/Admin, ורק אם לא בעריכה כרגע */}
                        {canDeleteComment(c) && editingCommentId !== c._id && (
                          <button
                            onClick={() => startEdit(c)}
                            className="text-gray-800 rounded border border-gray-400 px-2 py-0.5 text-xs hover:bg-gray-300"
                            title="Edit comment"
                          >
                            Edit
                          </button>
                        )}

                        {/* Delete – רק Owner/Admin */}
                        {canDeleteComment(c) && (
                          <button
                            onClick={() => onDeleteComment(c._id)}
                            disabled={deletingCommentId === c._id}
                            className="rounded border border-red-600 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                            title="Delete comment"
                          >
                            {deletingCommentId === c._id ? "Deleting…" : "Delete"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* גוף התגובה: מצב עריכה או תצוגה */}
                    {editingCommentId === c._id ? (
                      <form onSubmit={saveEdit} className="mt-2">
                        <textarea
                          className="text-gray-800 w-full rounded-md border px-3 py-2 text-sm"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      autoFocus
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                            type="submit"
                            disabled={posting}
                            className="rounded border border-gray-600 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-200"
                          >
                            {posting ? "Saving…" : "Save"}
                      </button>
                       <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded border border-gray-600 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="mt-1 text-sm text-gray-800">{c.text}</div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-600 mb-4">אין תגובות עדיין.</div>
            )}


            


              {/* טופס הוספת תגובה */}
              {authed ? (
                <form onSubmit={onAddComment} className="space-y-2">
                  <textarea
                    className="text-gray-600 w-full rounded-md border border-gray-600 p-2 text-sm"
                    placeholder="כתוב/כתבי תגובה…"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                  />
                  <div className="flex items-center gap-3">
                    <button
                      disabled={posting || commentText.trim().length === 0}
                      className="text-black rounded-md border border-gray-600 px-3 py-1.5 text-sm hover:bg-gray-200 disabled:opacity-50"
                    >
                      {posting ? "שולח…" : "הוסף תגובה"}
                    </button>
                    {postOk && <span className="text-xs text-green-700">{postOk}</span>}
                    {postError && <span className="text-xs text-red-600">{postError}</span>}
                  </div>
                </form>
              ) : (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  כדי להוסיף תגובה יש להתחבר.{" "}
                  <button
                    onClick={() => router.push("/login")}
                    className="underline decoration-dotted hover:opacity-80"
                  >
                    התחברות
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
