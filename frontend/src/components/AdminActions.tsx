import { FormEvent, useEffect, useMemo, useState } from "react";
import { useCreateEvent, useDeleteEvent } from "@/hooks/useEvents";
import { useCreateTable, useDeleteTable, useSeedTables } from "@/hooks/useTables";
import { useCreatePlayer, useDeletePlayer, usePlayers } from "@/hooks/usePlayers";
import { useRegisterPlayer } from "@/hooks/useRegistrations";
import { useEventStore } from "@/store/eventStore";
import { useSelection } from "@/store/selectionStore";
import type { TableEntity } from "@/types";

function useFeedback() {
  const [message, setMessage] = useState<string | null>(null);
  const [variant, setVariant] = useState<"success" | "error">("success");

  const show = (type: "success" | "error", text: string) => {
    setVariant(type);
    setMessage(text);
  };

  const reset = () => setMessage(null);

  return { message, variant, show, reset };
}

export default function AdminActions({ tables }: { tables?: TableEntity[] }) {
  const { activeEvent, setActiveEvent } = useEventStore();
  const { selected } = useSelection();
  const { data: players = [] } = usePlayers();

  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const createTable = useCreateTable(activeEvent?.id);
  const deleteTable = useDeleteTable(activeEvent?.id);
  const seedTables = useSeedTables(activeEvent?.id);
  const createPlayer = useCreatePlayer();
  const deletePlayer = useDeletePlayer();
  const registerPlayer = useRegisterPlayer(activeEvent?.id);

  const feedback = useFeedback();

  const [eventName, setEventName] = useState("");
  const [eventTablesCount, setEventTablesCount] = useState("1");
  const [eventLocation, setEventLocation] = useState("");
  const [autoSeed, setAutoSeed] = useState(true);

  const [tablePosition, setTablePosition] = useState("");
  const [tableToDelete, setTableToDelete] = useState("");

  const [seedCount, setSeedCount] = useState("");
  const [seedStart, setSeedStart] = useState("1");
  const [seedReset, setSeedReset] = useState(false);

  const [playerName, setPlayerName] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");
  const [playerToDelete, setPlayerToDelete] = useState("");
  const [playerToRegister, setPlayerToRegister] = useState("");

  useEffect(() => {
    if (!tableToDelete && tables?.length) {
      setTableToDelete(tables[0].id.toString());
    }
    if (tables?.length === 0) {
      setTableToDelete("");
    }
  }, [tables, tableToDelete]);

  useEffect(() => {
    if (!tables) return;
    const exists = tables.some((t) => t.id.toString() === tableToDelete);
    if (!exists) {
      setTableToDelete(tables[0] ? tables[0].id.toString() : "");
    }
  }, [tables, tableToDelete]);

  useEffect(() => {
    if (!playerToDelete && players.length) {
      setPlayerToDelete(players[0].id.toString());
    }
    if (players.length === 0) {
      setPlayerToDelete("");
    }
  }, [players, playerToDelete]);

  useEffect(() => {
    if (!players.length) return;
    const exists = players.some((p) => p.id.toString() === playerToDelete);
    if (!exists) {
      setPlayerToDelete(players[0]?.id.toString() ?? "");
    }
  }, [players, playerToDelete]);

  useEffect(() => {
    if (!playerToRegister && players.length) {
      setPlayerToRegister(players[0].id.toString());
    }
    if (players.length === 0) {
      setPlayerToRegister("");
    }
  }, [players, playerToRegister]);

  useEffect(() => {
    if (!players.length) return;
    const exists = players.some((p) => p.id.toString() === playerToRegister);
    if (!exists) {
      setPlayerToRegister(players[0]?.id.toString() ?? "");
    }
  }, [players, playerToRegister]);

  const tableOptions = useMemo(() => tables ?? [], [tables]);
  const isEventSelected = Boolean(activeEvent?.id);

  const handleCreateEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    feedback.reset();

    const count = Number(eventTablesCount);
    if (!eventName.trim()) {
      feedback.show("error", "Event name is required.");
      return;
    }
    if (!Number.isInteger(count) || count <= 0) {
      feedback.show("error", "Provide a valid number of tables (greater than zero).");
      return;
    }

    try {
      const created = await createEvent.mutateAsync({
        name: eventName.trim(),
        tables_count: count,
        location: eventLocation.trim() || null
      });
      setEventName("");
      setEventTablesCount("1");
      setEventLocation("");
      setAutoSeed(true);
      setActiveEvent(created);

      if (autoSeed) {
        try {
          await seedTables.mutateAsync({ eventId: created.id, count, reset: true, startAt: 1 });
          feedback.show(
            "success",
            `Event "${created.name}" created with ${count} table${count === 1 ? "" : "s"}.`
          );
        } catch (seedError) {
          const message =
            seedError instanceof Error
              ? seedError.message
              : "Event created but failed to auto-generate tables";
          feedback.show("error", message);
        }
      } else {
        feedback.show("success", `Event "${created.name}" created.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create event";
      feedback.show("error", message);
    }
  };

  const handleDeleteEvent = async () => {
    feedback.reset();
    if (!activeEvent?.id) {
      feedback.show("error", "Select an event before deleting.");
      return;
    }
    const confirmed = window.confirm(
      `Delete event "${activeEvent.name}" and all of its data? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteEvent.mutateAsync(activeEvent.id);
      setActiveEvent(undefined);
      feedback.show("success", "Event deleted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete event";
      feedback.show("error", message);
    }
  };

  const handleCreateTable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    feedback.reset();
    if (!isEventSelected) {
      feedback.show("error", "Select an event to manage tables.");
      return;
    }
    const position = Number(tablePosition);
    if (!Number.isInteger(position) || position <= 0) {
      feedback.show("error", "Provide a valid table position.");
      return;
    }

    try {
      await createTable.mutateAsync({ position });
      setTablePosition("");
      feedback.show("success", `Table ${position} created.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create table";
      feedback.show("error", message);
    }
  };

  const handleDeleteTable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    feedback.reset();
    if (!isEventSelected) {
      feedback.show("error", "Select an event to manage tables.");
      return;
    }
    if (!tableToDelete) {
      feedback.show("error", "Select a table to delete.");
      return;
    }
    const table = tableOptions.find((t) => t.id.toString() === tableToDelete);
    if (table && table.status && table.status.toLowerCase() !== "free") {
      feedback.show("error", "Free the table before deleting it.");
      return;
    }

    try {
      await deleteTable.mutateAsync({ tableId: tableToDelete });
      feedback.show("success", "Table deleted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete table";
      feedback.show("error", message);
    }
  };

  const handleSeedTables = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    feedback.reset();

    if (!isEventSelected) {
      feedback.show("error", "Select an event to manage tables.");
      return;
    }

    const countValue = seedCount.trim() ? Number(seedCount) : undefined;
    const startValue = seedStart.trim() ? Number(seedStart) : 1;

    if (countValue !== undefined && (!Number.isInteger(countValue) || countValue <= 0)) {
      feedback.show("error", "Provide a valid number of tables to generate.");
      return;
    }
    if (!Number.isInteger(startValue) || startValue <= 0) {
      feedback.show("error", "Provide a valid starting position (1 or greater).");
      return;
    }

    try {
      await seedTables.mutateAsync({
        count: countValue,
        startAt: startValue,
        reset: seedReset
      });
      feedback.show(
        "success",
        seedReset ? "Tables reset and generated." : "Tables generated successfully."
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate tables";
      feedback.show("error", message);
    }
  };

  const handleCreatePlayer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    feedback.reset();

    if (!playerName.trim()) {
      feedback.show("error", "Player name is required.");
      return;
    }
    if (!playerPhone.trim()) {
      feedback.show("error", "Player phone is required.");
      return;
    }

    try {
      await createPlayer.mutateAsync({
        full_name: playerName.trim(),
        phone_number: playerPhone.trim()
      });
      setPlayerName("");
      setPlayerPhone("");
      feedback.show("success", "Player added.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add player";
      feedback.show("error", message);
    }
  };

  const handleDeletePlayer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    feedback.reset();
    if (!playerToDelete) {
      feedback.show("error", "Select a player to delete.");
      return;
    }

    const player = players.find((p) => p.id.toString() === playerToDelete);
    const confirmed = window.confirm(
      player ? `Delete player "${player.full_name}"? This cannot be undone.` : "Delete selected player?"
    );
    if (!confirmed) return;

    try {
      await deletePlayer.mutateAsync(playerToDelete);
      feedback.show("success", "Player deleted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete player";
      feedback.show("error", message);
    }
  };

  const handleRegisterPlayer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    feedback.reset();
    if (!isEventSelected) {
      feedback.show("error", "Select an event to register players.");
      return;
    }
    if (!playerToRegister) {
      feedback.show("error", "Select a player to register.");
      return;
    }

    try {
      await registerPlayer.mutateAsync({ playerId: playerToRegister });
      feedback.show("success", "Player registered for the event.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to register player";
      feedback.show("error", message);
    }
  };

  const handleRegisterSelected = async () => {
    feedback.reset();
    if (!isEventSelected) {
      feedback.show("error", "Select an event to register players.");
      return;
    }
    if (!selected.length) {
      feedback.show("error", "Select players from the list first.");
      return;
    }

    try {
      for (const p of selected) {
        await registerPlayer.mutateAsync({ playerId: p.id });
      }
      feedback.show("success", `${selected.length} player(s) registered for the event.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to register selected players";
      feedback.show("error", message);
    }
  };

  const inputClasses =
    "w-full rounded-xl border border-slate-800/70 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none";
  const buttonPrimary =
    "w-full rounded-xl border border-sky-400/40 bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-300 hover:bg-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60";
  const buttonGhost =
    "w-full rounded-xl border border-slate-800/70 bg-slate-950/60 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-sky-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60";
  const sectionTitle = "text-sm font-semibold uppercase tracking-wide text-slate-400";

  return (
    <section className="space-y-8 text-slate-200">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Operations console</h2>
        <p className="text-xs text-slate-400">Manage events, tables, and player registrations without leaving the dashboard.</p>
      </div>

      {feedback.message && (
        <div
          className={`rounded-xl border px-3 py-2 text-sm ${
            feedback.variant === "success"
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
              : "border-rose-400/40 bg-rose-500/10 text-rose-100"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={handleCreateEvent} className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
          <div className="space-y-1">
            <h3 className={sectionTitle}>Create event</h3>
            <p className="text-xs text-slate-400">Spin up a fresh competition in seconds.</p>
          </div>
          <input className={inputClasses} placeholder="Event name" value={eventName} onChange={(e) => setEventName(e.target.value)} />
          <input
            className={inputClasses}
            placeholder="Number of tables"
            type="number"
            min={1}
            value={eventTablesCount}
            onChange={(e) => setEventTablesCount(e.target.value)}
          />
          <input
            className={inputClasses}
            placeholder="Location (optional)"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
          />
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={autoSeed}
              onChange={(e) => setAutoSeed(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-400 focus:ring-sky-400"
            />
            Auto generate tables after creating the event
          </label>
          <button type="submit" className={buttonPrimary} disabled={createEvent.isPending}>
            {createEvent.isPending ? "Creating…" : "Create event"}
          </button>
        </form>

        <div className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
          <div className="space-y-1">
            <h3 className={sectionTitle}>Delete active event</h3>
            <p className="text-xs text-slate-400">Removes the current event and everything linked to it.</p>
          </div>
          <button
            type="button"
            className="w-full rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:border-rose-300 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleDeleteEvent}
            disabled={!activeEvent || deleteEvent.isPending}
          >
            {deleteEvent.isPending ? "Deleting…" : "Delete event"}
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={handleCreateTable} className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
          <div className="space-y-1">
            <h3 className={sectionTitle}>Add table</h3>
            <p className="text-xs text-slate-400">Assign a new position number to create a table.</p>
          </div>
          <input
            className={inputClasses}
            placeholder="Table position"
            value={tablePosition}
            onChange={(e) => setTablePosition(e.target.value)}
            type="number"
            min={1}
          />
          <button type="submit" className={buttonGhost} disabled={createTable.isPending}>
            {createTable.isPending ? "Adding…" : "Add table"}
          </button>
        </form>

        <form onSubmit={handleDeleteTable} className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
          <div className="space-y-1">
            <h3 className={sectionTitle}>Delete table</h3>
            <p className="text-xs text-slate-400">Choose a table from the current event.</p>
          </div>
          <select
            className={`${inputClasses} appearance-none`}
            value={tableToDelete}
            onChange={(e) => setTableToDelete(e.target.value)}
          >
            <option value="" disabled>
              {tableOptions.length ? "Select a table" : "No tables available"}
            </option>
            {tableOptions.map((table) => (
              <option key={table.id} value={table.id.toString()}>
                {table.label || `Table ${table.position ?? table.id}`}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="w-full rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:border-rose-300 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={deleteTable.isPending || !tableOptions.length}
          >
            {deleteTable.isPending ? "Deleting…" : "Delete table"}
          </button>
        </form>
      </div>

      <form
        onSubmit={handleSeedTables}
        className="space-y-4 rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/40 p-5"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className={sectionTitle}>Auto-generate tables</h3>
            <p className="text-xs text-slate-400">Use the event defaults or override below.</p>
          </div>
          <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-100">
            Quick fill helper
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-400">How many</label>
            <input
              className={inputClasses}
              placeholder="Event default"
              value={seedCount}
              onChange={(e) => setSeedCount(e.target.value)}
              type="number"
              min={1}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Start at position</label>
            <input
              className={inputClasses}
              value={seedStart}
              onChange={(e) => setSeedStart(e.target.value)}
              type="number"
              min={1}
            />
          </div>
          <label className="flex items-center gap-2 pt-6 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={seedReset}
              onChange={(e) => setSeedReset(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-400 focus:ring-sky-400"
            />
            Reset existing tables first
          </label>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button type="submit" className={buttonPrimary} disabled={seedTables.isPending}>
            {seedTables.isPending ? "Generating…" : "Generate tables"}
          </button>
        </div>
      </form>

      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={handleCreatePlayer} className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
          <div className="space-y-1">
            <h3 className={sectionTitle}>Add player</h3>
            <p className="text-xs text-slate-400">Capture core contact info.</p>
          </div>
          <input
            className={inputClasses}
            placeholder="Full name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <input
            className={inputClasses}
            placeholder="Phone number"
            value={playerPhone}
            onChange={(e) => setPlayerPhone(e.target.value)}
          />
          <button type="submit" className={buttonGhost} disabled={createPlayer.isPending}>
            {createPlayer.isPending ? "Adding…" : "Add player"}
          </button>
        </form>

        <form onSubmit={handleDeletePlayer} className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
          <div className="space-y-1">
            <h3 className={sectionTitle}>Delete player</h3>
            <p className="text-xs text-slate-400">Remove players who no longer participate.</p>
          </div>
          <select
            className={`${inputClasses} appearance-none`}
            value={playerToDelete}
            onChange={(e) => setPlayerToDelete(e.target.value)}
          >
            <option value="" disabled>
              {players.length ? "Select a player" : "No players available"}
            </option>
            {players.map((player) => (
              <option key={player.id} value={player.id.toString()}>
                {player.full_name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="w-full rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:border-rose-300 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={deletePlayer.isPending || !players.length}
          >
            {deletePlayer.isPending ? "Deleting…" : "Delete player"}
          </button>
        </form>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={handleRegisterPlayer} className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
          <div className="space-y-1">
            <h3 className={sectionTitle}>Register player to event</h3>
            <p className="text-xs text-slate-400">Move a player from the database onto the roster.</p>
          </div>
          <select
            className={`${inputClasses} appearance-none`}
            value={playerToRegister}
            onChange={(e) => setPlayerToRegister(e.target.value)}
          >
            <option value="" disabled>
              {players.length ? "Select a player" : "No players available"}
            </option>
            {players.map((player) => (
              <option key={player.id} value={player.id.toString()}>
                {player.full_name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className={buttonGhost}
            disabled={registerPlayer.isPending || !players.length}
          >
            {registerPlayer.isPending ? "Registering…" : "Register player"}
          </button>
        </form>

        <div className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
          <div className="space-y-1">
            <h3 className={sectionTitle}>Register selected players</h3>
            <p className="text-xs text-slate-400">Use the selection from the player list on the left.</p>
          </div>
          <button
            type="button"
            className={buttonPrimary}
            onClick={handleRegisterSelected}
            disabled={registerPlayer.isPending || selected.length === 0}
          >
            {registerPlayer.isPending ? "Working…" : `Register ${selected.length || "selected"}`}
          </button>
        </div>
      </div>
    </section>
  );
}
