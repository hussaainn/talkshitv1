export default function TopicCard({ topic, roundNumber }) {
  if (!topic) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-center text-zinc-500">
        No topic yet.
      </div>
    );
  }

  return (
    <div className="animate-card-in rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-zinc-800 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-zinc-300">
          {topic.category}
        </span>
        {roundNumber != null && (
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            Round {roundNumber}
          </span>
        )}
      </div>
      <p className="mt-4 text-xl font-extrabold leading-snug tracking-tight text-zinc-50">
        {topic.question}
      </p>
      {topic.sides?.length === 2 && (
        <div className="mt-4 flex gap-2">
          {topic.sides.map((side) => (
            <span
              key={side}
              className="flex-1 rounded-xl bg-zinc-900 px-3 py-2 text-center text-sm font-black tracking-wide text-lime-200"
            >
              {side}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
