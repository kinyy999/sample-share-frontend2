import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black px-6 py-12 text-slate-100 flex flex-col items-center justify-between">
      {/* HEADER */}
      <header className="w-full max-w-4xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-bold mb-2 text-white tracking-tight">
          Welcome to <span className="text-cyan-400">SampleShare</span>
        </h1>
        <p className="text-slate-300 text-sm">
          Built with Next.js, styled for the dark side ⚡
        </p>
      </header>

      {/* MAIN CONTENT CARD */}
      <section className="w-full max-w-3xl mx-auto rounded-2xl border border-slate-700/60 bg-slate-900/40 backdrop-blur-xl shadow-xl p-8 flex flex-col items-center gap-8">
        <Image
          className="opacity-90"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />

        <ol className="list-decimal list-inside text-slate-200/90 font-light text-sm sm:text-base space-y-2 text-center sm:text-left">
          <li>
            Get started by editing{" "}
            <code className="bg-slate-800/70 border border-slate-600 text-cyan-300 font-mono px-2 py-1 rounded-md">
              src/app/page.tsx
            </code>
            .
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <a
            className="rounded-full border border-slate-600 bg-cyan-400/90 hover:bg-cyan-300 text-slate-900 font-semibold text-sm sm:text-base h-11 px-6 flex items-center gap-2 transition-all"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>

          <a
            className="rounded-full border border-slate-700 hover:border-cyan-400 hover:bg-slate-800/50 text-slate-100 font-medium text-sm sm:text-base h-11 px-6 flex items-center justify-center transition-all"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-16 text-slate-400 flex flex-wrap gap-6 items-center justify-center text-sm">
        <a
          className="flex items-center gap-2 hover:text-cyan-300 transition"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/file.svg" alt="File icon" width={16} height={16} />
          Learn
        </a>

        <a
          className="flex items-center gap-2 hover:text-cyan-300 transition"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/window.svg" alt="Window icon" width={16} height={16} />
          Examples
        </a>

        <a
          className="flex items-center gap-2 hover:text-cyan-300 transition"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/globe.svg" alt="Globe icon" width={16} height={16} />
          Go to nextjs.org →
        </a>
      </footer>
    </main>
  );
}
