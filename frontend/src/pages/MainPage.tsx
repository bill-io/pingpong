import PlayerList from "@/components/PlayerList";
import { useTables } from "@/hooks/useTables";
import TableCard from "@/components/TableCard";

export default function MainPage() {
  const { data, isLoading, error } = useTables();

  return (
    <div className="min-h-screen p-4 md:p-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">PingPong Control</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <aside className="md:col-span-1">
          <PlayerList />
        </aside>

        <main className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Tables</h2>
          </div>

          {isLoading ? (
            <div className="p-3 text-sm opacity-70">Loading tables…</div>
          ) : error ? (
            <div className="p-3 text-sm text-red-600">Failed to load tables</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.map((t) => <TableCard key={t.id} table={t} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
