import { ArrowRight, Brain, CheckCircle2, HardDrive, Keyboard, LockKeyhole, Scissors, Sparkles, Upload, WandSparkles } from "lucide-react";
import { CreateProject } from "./CreateProject";

const workflow = [
  { number: "01", title: "Add your source", text: "Drop in an MP4 and optional SRT transcript. Your files stay on this machine.", icon: Upload, color: "bg-violet-100 text-violet-700" },
  { number: "02", title: "Find the moments", text: "Analyze your transcript and scan AI-detected scenes with timestamps, summaries, and scores.", icon: Brain, color: "bg-fuchsia-100 text-fuchsia-700" },
  { number: "03", title: "Cut the clips", text: "Select the moments worth keeping, trim them, and prepare a focused clip library.", icon: Scissors, color: "bg-amber-100 text-amber-700" },
  { number: "04", title: "Export separately", text: "Add shared opening and closing cards, then render each clip to its own local MP4.", icon: WandSparkles, color: "bg-emerald-100 text-emerald-700" },
];

export function LandingPage() {
  return (
    <main className="h-full min-h-0 overflow-y-auto overscroll-contain scroll-smooth">
      <section className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
            <Sparkles size={14} /> Local-first short-form studio
          </div>
          <h1 className="text-5xl font-black tracking-[-0.06em] text-slate-950 sm:text-7xl">
            Make the good parts <span className="text-gradient">impossible to miss.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            CocktailClips turns long videos and transcripts into polished short-form clips. Find the signal, cut with confidence, brand each clip, and export without sending your media to the cloud.
          </p>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            {[
              [LockKeyhole, "Private by default"],
              [HardDrive, "Runs locally"],
              [CheckCircle2, "One project file"],
            ].map(([Icon, label]) => (
              <div key={label as string} className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Icon size={16} className="text-violet-600" /> {label as string}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white bg-white/80 p-2 shadow-[0_20px_60px_rgba(45,35,75,.12)]">
          <div className="rounded-[22px] bg-slate-50 px-2 py-1">
            <CreateProject compact />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 border-y border-slate-200/80 bg-white/55 px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">How it works</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">A clear path from raw footage to ready-to-post.</h2>
            <p className="mt-3 text-slate-500">Every tool is available in one continuous workflow after you create a project.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workflow.map(({ number, title, text, icon: Icon, color }) => (
              <article key={number} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}><Icon size={20} /></div>
                <p className="text-xs font-bold tracking-widest text-slate-400">{number}</p>
                <h3 className="mt-2 font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1400px] gap-5 px-5 py-12 sm:px-8 lg:grid-cols-2">
        <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl">
          <div className="mb-5 flex items-center gap-3"><Keyboard className="text-violet-300" /><h2 className="text-xl font-bold">Quick help</h2></div>
          <p className="mb-5 text-sm leading-6 text-slate-300">Once inside a project, use these shortcuts to move faster through the editor.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[['Space', 'Play / pause preview'], ['← →', 'Seek through video'], ['I / O', 'Mark in / out points'], ['⌘ / Ctrl + E', 'Jump to export'], ['Delete', 'Remove selection'], ['?', 'Show shortcut help']].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-sm"><span className="text-slate-300">{label}</span><kbd className="rounded-md bg-white/15 px-2 py-1 font-mono text-xs text-violet-200">{key}</kbd></div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-7">
          <div className="mb-5 flex items-center gap-3"><LockKeyhole className="text-violet-600" /><h2 className="text-xl font-bold text-slate-900">Built for private editing</h2></div>
          <div className="space-y-4 text-sm leading-6 text-slate-600">
            <p><strong className="text-slate-900">No cloud uploads.</strong> Your video, transcript, project JSON, and generated clips remain in your local project directory.</p>
            <p><strong className="text-slate-900">One source of truth.</strong> The master project JSON keeps scenes, clips, brand cards, and individual export status together.</p>
            <p><strong className="text-slate-900">Designed for iteration.</strong> Recut clips, reorder the timeline, adjust hooks, and export again without losing your work.</p>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1400px] items-center gap-2 px-5 pb-12 text-xs text-slate-400 sm:px-8"><CheckCircle2 size={14} className="text-emerald-500" /> Your editing workspace is local, visual, and built around one project file.</footer>
    </main>
  );
}
