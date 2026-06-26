const code = "px-1 py-0.5 rounded bg-paper text-crayon-blue text-[13px]";

const STEPS: React.ReactNode[] = [
  <>Save the file.</>,
  <>
    Steam → right-click the game → <b>Properties</b> → <b>Browse local files</b>.
  </>,
  <>
    Copy the level file into the <code className={code}>Levels</code> folder.
  </>,
  <>
    Rename / replace <code className={code}>Level_2.txt</code> with your level.
  </>,
  <>Boot the game and complete the tutorial.</>,
];

export function HowToPanel() {
  return (
    <div className="w-72 shrink-0 h-full overflow-y-auto bg-panel border-l-2 border-line flex flex-col">
      <div className="px-3 py-2.5 border-b-2 border-line">
        <div className="font-block font-bold text-xl text-ink text-center">
          Use Your Level
        </div>
      </div>
      <ol className="p-3 flex flex-col gap-3 font-block text-sm text-ink/90">
        {STEPS.map((step, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="shrink-0 w-6 h-6 rounded-full bg-crayon-blue text-[#15140f] font-bold flex items-center justify-center text-sm">
              {i + 1}
            </span>
            <span className="leading-snug pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
