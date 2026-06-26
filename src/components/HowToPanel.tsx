const code = "px-1 py-0.5 rounded bg-paper text-crayon-blue text-[13px]";

const CONTROLS: React.ReactNode[] = [
  <>
    <b>WASD</b> to pan camera
  </>,
  <>
    <b>Left click</b> to paint
  </>,
  <>
    <b>Right click</b> to erase
  </>,
];

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

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-3 border-b-2 border-line">
      <div className="font-block font-bold text-sm uppercase tracking-wide text-muted mb-2.5">
        {title}
      </div>
      {children}
    </div>
  );
}

export function HowToPanel() {
  return (
    <div className="w-72 shrink-0 h-full overflow-y-auto bg-panel border-l-2 border-line flex flex-col">
      <div className="px-3 py-2.5 border-b-2 border-line">
        <div className="font-block font-bold text-xl text-ink text-center">
          Info
        </div>
      </div>

      <Group title="Controls">
        <ul className="flex flex-col gap-2 font-block text-sm text-ink/90">
          {CONTROLS.map((item, i) => (
            <li key={i} className="flex gap-2.5 items-start">
              <span className="shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-crayon-blue" />
              <span className="leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      </Group>

      <Group title="Use Your Level">
        <ol className="flex flex-col gap-3 font-block text-sm text-ink/90">
          {STEPS.map((step, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="shrink-0 w-6 h-6 rounded-full bg-crayon-blue text-[#15140f] font-bold flex items-center justify-center text-sm">
                {i + 1}
              </span>
              <span className="leading-snug pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </Group>
    </div>
  );
}
