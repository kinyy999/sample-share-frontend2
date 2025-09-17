"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";


const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

type Sample = {
  _id: string;
  title: string;
  bpm: number;
  key: string;
  genre: string;
  owner?: string;
  url?: string;
  artist?: string;
  tags?: string[];
  length?: number;
  description?: string;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
  audio?: string;   
};

function AddSampleForm({ API_BASE }: { API_BASE: string }) {
  const [open, setOpen] = useState(false);          // ← חדש: פתוח/סגור
  const [form, setForm] = useState({ title: '', bpm: '', key: '', genre: '', url: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [hasFocus, setHasFocus] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  

  const TOKEN_KEY = 'auth_token';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  const formEl = e.currentTarget;   // לשמור הפניה לטופס
  setMsg(null);
  setSaving(true);

  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { 
      setMsg("You must log in first");
      return;
    }

    // שולחים את כל השדות + הקובץ
    const fd = new FormData(formEl);

    const res = await fetch(`${API_BASE}/samples`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }, // בלי Content-Type
      body: fd,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data?.error || `Failed to create (status ${res.status})`);
      return;
    }

    setMsg("Created ✅");
    formEl.reset(); // איפוס כל השדות כולל האודיו
    setForm({ title: "", bpm: "", key: "", genre: "", url: "" });

    // ריענון הרשימה בלי רילוד
    window.dispatchEvent(new CustomEvent("samples:refresh"));

    // נסגור את הטופס רק אחרי חצי שנייה, כדי שתראה את ההודעה
    setTimeout(() => setOpen(false), 800);
  } catch (err: any) {
    setMsg(err?.message || "Network error");
  } finally {
    setSaving(false);
  }
}



  return (
    <div
      ref={wrapRef}
      onMouseEnter={() => setOpen(true)}              // ← נפתח ב-hover
      onMouseLeave={() => {
        if (saving) return;
        if (hasFocus) return;          // ← חדש: לא נסגר אם מקלידים בפנים
        setOpen(false);
      }}
      onClick={() => setOpen(true)}                   // ← וגם ב-click
      onFocusCapture={() => setHasFocus(true)}   // ← עוקב אחרי פוקוס בתוך הטופס
      onBlurCapture={() => setHasFocus(false)}   // ← מתבטל כשאין יותר פוקוס בפנים
      className="mb-6 rounded-lg border border-gray-600 bg-white p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between cursor-pointer select-none">
        <h2 className="text-black text-lg font-semibold">Add Sample</h2>
        {!open && (
          <span className="text-sm text-gray-500">לחץ או רחף כדי לפתוח</span>
        )}
    </div>

      {/* אזור הטופס – נפתח/נסגר עם אנימציה */}
      <div
        aria-hidden={!open}
        className={`mt-3 overflow-hidden transition-all duration-300 ${
          open ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="text-black grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              name="title"
              className="rounded-md border px-3 py-2"
              placeholder="Title *"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
            />

            <input
              name="bpm"
              className="rounded-md border px-3 py-2"
              placeholder="BPM"
              value={form.bpm}
              onChange={e => setForm({ ...form, bpm: e.target.value })}
              inputMode="numeric"
            />

            <input
              name="key"
  className="rounded-md border px-3 py-2"
  placeholder="Key (e.g. Am)"
  value={form.key}
              onChange={e => setForm({ ...form, key: e.target.value })}
            />

            <input
              name="genre"
              className="rounded-md border px-3 py-2"
              placeholder="Genre"
              value={form.genre}
              onChange={e => setForm({ ...form, genre: e.target.value })}
            />

            <input
              name="url"
              className="md:col-span-2 rounded-md border px-3 py-2"
              placeholder="URL (optional)"
              value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
            />

            <input
              type="file"
              name="audio"
              accept="audio/*"
              required
              className="md:col-span-2 rounded-md border px-3 py-2"
            />

       
          </div>

          <div className="flex items-center gap-3">
            <button disabled={saving}
                    className="text-black rounded-md border px-3 py-1.5 text-sm hover:bg-blue-200 disabled:opacity-50">
              {saving ? 'Saving…' : 'Create'}
            </button>
            {msg && <span className="text-red-400 text-sm">{msg}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}



export default function SamplesPage() {
  const router = useRouter();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => { setAuthToken(localStorage.getItem("auth_token")); }, []);


  
  // --- auth context (מי אני) ---
  function readTokenPayload() {
    const t = localStorage.getItem('auth_token');
    if (!t) return null;
    try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; }
  }

  const [me, setMe] = useState<{ id: string | null; role: string | null }>({
    id: null,
    role: null,
  });

  useEffect(() => {
    setMounted(true);
    setAuthToken(localStorage.getItem('auth_token') ?? null);
  }, []);

 

  useEffect(() => {
  const p = readTokenPayload();
  setMe({
    id: p?.userId ?? null,
    role: localStorage.getItem('auth_role'),
  });
  }, []);

  const canDelete = (s: Sample) =>
   me?.role === 'admin' || (!!me?.id && !!s.owner && s.owner === me.id);

  async function onDelete(id: string) {
    const token = localStorage.getItem('auth_token');
    if (!token) { router.push('/login'); return; }
    if (!confirm('Delete this sample?!')) return;

    try {
      const res = await fetch(`${API_BASE}/samples/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
       localStorage.removeItem('auth_token');
       localStorage.removeItem('auth_role');
       setError('Session expired. Please log in again.');
       router.push('/login');
       return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Delete failed (${res.status})`);

      // רענון הרשימה בלי רילוד
      window.dispatchEvent(new CustomEvent('samples:refresh'));
    } catch (e: any) {
      setError(e?.message || 'Network error');
    }
  }



const fetchSamples = async () => {
  try {
    const res = await fetch(`${API_BASE}/samples`, { headers: { 'Content-Type': 'application/json' }});
    let data: any = null;
    try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error(data?.error || `Failed to load samples (status ${res.status})`);

    const list =
      Array.isArray(data?.items)   ? data.items :
      Array.isArray(data)          ? data :
      Array.isArray(data?.samples) ? data.samples :
      Array.isArray(data?.data)    ? data.data : [];

    setSamples(list);
    setError(null);
  } catch (e: any) {
    setError(e?.message || 'Network error');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    const handler = () => {
    setLoading(true);
    fetchSamples();
     };
      window.addEventListener('samples:refresh', handler);
      return () => window.removeEventListener('samples:refresh', handler);
    }, []);
    


    useEffect(() => {
      setLoading(true);
      fetchSamples();
    }, [router]);

    // filtering (מעל return)
    const visible = search.trim()
      ? samples.filter((s) => {
          const q = search.toLowerCase();
          return (
            (s.title ?? '').toLowerCase().includes(q) ||
            (s.genre ?? '').toLowerCase().includes(q) ||
            (s.key ?? '').toLowerCase().includes(q) ||
            String(s.bpm ?? '').includes(q)
          );
        })
      : samples;



  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto w-full max-w-3xl">
       <header className="mb-6 flex items-center justify-between">
  <h1 className="text-2xl text-black font-bold">Samples</h1>

  {mounted && (
    authToken ? (
      <button
        onClick={() => {
          if (!confirm('Are you sure you want to log out?')) return;
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_role');
          setAuthToken(null);
          router.push('/samples');
        }}
        className="text-red-700 rounded-md border border-red-700 px-3 py-1.5 text-sm hover:bg-red-200"
      >
        Logout
      </button>
    ) : (
      <div className="flex gap-3">
        <Link href="/login" className="text-gray-700 rounded-md border text-gray-700 px-3 py-1.5 text-sm hover:bg-gray-300">
          Login
        </Link>
        <Link href="/register" className="text-gray-700 rounded-md border text-gray-700 px-3 py-1.5 text-sm hover:bg-gray-300">
          Register
        </Link>
      </div>
    )
  )}
</header>


        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי כותרת / ז'אנר / סולם / BPM"
            className="text-gray-500 w-full rounded-md border border-gray-700 px-3 py-2"
          />
        </div>

        <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
          <span>
            {search.trim()
              ? `נמצאו ${visible.length} תוצאות`
              : `סה״כ ${samples.length} פריטים`}
          </span>

          {search.trim() && (
            <button
              onClick={() => setSearch('')}
              className="underline hover:no-underline text-red-400"
              title="נקה חיפוש"
            >
              נקה חיפוש
            </button>
          )}
        </div>


        <AddSampleForm API_BASE={API_BASE} />


        {/* מצבי טעינה/שגיאה/תוכן */}
        {loading && (
          <div className="rounded-md border border-gray-700 bg-white p-4">
            Loading samples…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && samples.length === 0 && (
          <div className="rounded-md border border-gray-700 bg-white p-6 text-gray-600">
            לא נמצאו דגימות עדיין. תוסיפו דרך ה-API או נבנה טופס הוספה בצעד הבא.
          </div>
        )}

        {!loading && !error && search.trim() && samples.length > 0 && visible.length === 0 && (
          <div className="rounded-md border border-gray-200 bg-white p-6 text-gray-600">
            !!לא נמצאו תוצאות עבור "<span className="text-red-600 font-semibold">{search}</span>".
          </div>
        )}


        {!loading && !error && visible.length > 0 && (
          <ul className="space-y-3">
            {visible.map((s) => (
              <li
                key={s._id}
                className="rounded-lg border border-gray-600 bg-white p-4"
              >
                <div className="text-gray-700 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Link href={`/samples/${s._id}`} className="hover:underline">
                        {s.title}
                      </Link>

                     { s.audio && (
                      <div className="transform scale-75 origin-left">
                      <audio controls preload="metadata" src={`${API_BASE}/uploads/${s.audio}`} />

                      </div>
                    )}


                      {s.owner === me.id && (
                        <span className="ml-2 rounded-full border  px-2 py-0.5 origin-left text-xs text-gray-700 bg-blue-100 ">
                          me
                        </span>
                     )}
                    </h2>



                    <p className="text-sm text-gray-500">
                      BPM: <span className="font-medium text-black">{s.bpm}</span> · Key:{" "}
                      <span className="font-medium text-black">{s.key}</span> · Genre:{" "}
                      <span className="font-medium text-black">{s.genre}</span>
                    </p>
                    {s.artist && (
                      <p className="mt-1 text-sm text-gray-700">Artist: {s.artist}</p>
                    )}
                    {s.tags && s.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {s.tags.map((t, i) => (
                          <span
                            key={`${s._id}-tag-${i}`}
                            className="rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-700"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="ml-3 flex items-center gap-2">
                  {s.audio && (
                      <a
                      href={`${API_BASE}/download/${s._id}`}
                        className="inline-flex items-center text-black rounded-md border border-gray-400 px-3 py-1.5 text-sm hover:bg-gray-500"
                        
                        download
                        title="Download sample"
                      >
                        Download
                      </a>
                    )}


                  {canDelete(s) && (
                    <button
                      onClick={() => onDelete(s._id)}
                      className="inline-flex items-center rounded-md border border-red-600 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                      title="Delete sample"
                    >
                      Delete
                    </button>
                  )}
                  </div>

                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}


