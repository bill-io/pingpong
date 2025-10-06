import { FormEvent, useEffect, useMemo, useState } from "react";
import { useCreateEvent, useDeleteEvent } from "@/hooks/useEvents";
import { useCreateTable, useDeleteTable } from "@/hooks/useTables";
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
  const createPlayer = useCreatePlayer();
  const deletePlayer = useDeletePlayer();
  const registerPlayer = useRegisterPlayer(activeEvent?.id);

  const feedback = useFeedback();

  const [eventName, setEventName] = useState("");
  const [eventTablesCount, setEventTablesCount] = useState("1");
  const [eventLocation, setEventLocation] = useState("");

  const [tablePosition, setTablePosition] = useState("");
  const [tableToDelete, setTableToDelete] = useState("");

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
      setPlayerToDelete(players[0].id.toString());
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
      setPlayerToRegister(players[0].id.toString());
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
      setActiveEvent(created);
      feedback.show("success", `Event "${created.name}" created.`);
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

  return (
    <section className="rounded-2xl border p-4 space-y-4 bg-white/60">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Quick actions</h2>
        <p className="text-xs opacity-70">
          Use these helpers to manage events, tables and player registrations.
        </p>
      </div>

      {feedback.message && (
        <div
          className={`text-sm rounded-md border px-3 py-2 ${
            feedback.variant === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <form onSubmit={handleCreateEvent} className="space-y-2">
          <h3 className="font-medium">Create event</h3>
          <input
            className="w-full rounded-lg border px-3 py-1.5 text-sm"
            placeholder="Event name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
          />
          <input
            className="w-full rounded-lg border px-3 py-1.5 text-sm"
            placeholder="Number of tables"
            type="number"
            min={1}
            value={eventTablesCount}
            onChange={(e) => setEventTablesCount(e.target.value)}
          />
          <input
            className="w-full rounded-lg border px-3 py-1.5 text-sm"
            placeholder="Location (optional)"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 text-white py-1.5 text-sm"
            disabled={createEvent.isPending}
          >
            {createEvent.isPending ? "Creating…" : "Create event"}
          </button>
        </form>

        <div className="space-y-2">
          <h3 className="font-medium">Delete active event</h3>
          <p className="text-xs opacity-70">
            Removes the current event and everything linked to it.
          </p>
          <button
            type="button"
            className="w-full rounded-lg border border-red-300 text-red-700 py-1.5 text-sm hover:bg-red-50"
            onClick={handleDeleteEvent}
            disabled={!activeEvent || deleteEvent.isPending}
          >
            {deleteEvent.isPending ? "Deleting…" : "Delete event"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <form onSubmit={handleCreateTable} className="space-y-2">
          <h3 className="font-medium">Add table</h3>
          <p className="text-xs opacity-70">Assign a new position number to create a table.</p>
          <input
            className="w-full rounded-lg border px-3 py-1.5 text-sm"
            placeholder="Table position"
            value={tablePosition}
            onChange={(e) => setTablePosition(e.target.value)}
            type="number"
            min={1}
          />
          <button
            type="submit"
            className="w-full rounded-lg border py-1.5 text-sm hover:bg-gray-50"
            disabled={createTable.isPending}
          >
            {createTable.isPending ? "Adding…" : "Add table"}
          </button>
        </form>

        <form onSubmit={handleDeleteTable} className="space-y-2">
          <h3 className="font-medium">Delete table</h3>
          <p className="text-xs opacity-70">Choose a table from the current event.</p>
          <select
            className="w-full rounded-lg border px-3 py-1.5 text-sm"
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
            className="w-full rounded-lg border border-red-300 text-red-700 py-1.5 text-sm hover:bg-red-50"
            disabled={deleteTable.isPending || !tableOptions.length}
          >
            {deleteTable.isPending ? "Deleting…" : "Delete table"}
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <form onSubmit={handleCreatePlayer} className="space-y-2">
          <h3 className="font-medium">Add player</h3>
          <input
            className="w-full rounded-lg border px-3 py-1.5 text-sm"
            placeholder="Full name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <input
            className="w-full rounded-lg border px-3 py-1.5 text-sm"
            placeholder="Phone number"
            value={playerPhone}
            onChange={(e) => setPlayerPhone(e.target.value)}
          />
          <button
            type="submit"
            className="w-full rounded-lg border py-1.5 text-sm hover:bg-gray-50"
            disabled={createPlayer.isPending}
          >
            {createPlayer.isPending ? "Adding…" : "Add player"}
          </button>
        </form>

        <form onSubmit={handleDeletePlayer} className="space-y-2">
          <h3 className="font-medium">Delete player</h3>
          <select
            className="w-full rounded-lg border px-3 py-1.5 text-sm"
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
            className="w-full rounded-lg border border-red-300 text-red-700 py-1.5 text-sm hover:bg-red-50"
            disabled={deletePlayer.isPending || !players.length}
          >
            {deletePlayer.isPending ? "Deleting…" : "Delete player"}
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <form onSubmit={handleRegisterPlayer} className="space-y-2">
          <h3 className="font-medium">Register player to event</h3>
          <select
            className="w-full rounded-lg border px-3 py-1.5 text-sm"
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
            className="w-full rounded-lg border py-1.5 text-sm hover:bg-gray-50"
            disabled={registerPlayer.isPending || !players.length}
          >
            {registerPlayer.isPending ? "Registering…" : "Register player"}
          </button>
        </form>

        <div className="space-y-2">
          <h3 className="font-medium">Register selected players</h3>
          <p className="text-xs opacity-70">
            Uses the selection from the player list on the left.
          </p>
          <button
            type="button"
            className="w-full rounded-lg border py-1.5 text-sm hover:bg-gray-50"
            onClick={handleRegisterSelected}
            disabled={registerPlayer.isPending || selected.length === 0}
          >
            {registerPlayer.isPending ? "Working…" : "Register selected"}
          </button>
        </div>
      </div>
    </section>
  );
}