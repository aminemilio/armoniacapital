export function PageShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-serif text-4xl text-bone sm:text-5xl">{title}</h1>
      {intro && <p className="mt-4 text-lg leading-relaxed text-bone/75">{intro}</p>}
      <div className="mt-10 space-y-5 leading-relaxed text-bone/80 [&_h2]:mt-10 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-bone [&_a]:text-brass-light [&_a]:underline">
        {children}
      </div>
    </div>
  );
}
