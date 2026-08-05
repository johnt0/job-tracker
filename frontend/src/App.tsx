import { useState, useEffect } from "react";
import "./App.css";
import Header from "./components/Header";
import StatusTiles from "./components/StatusTiles";
import Toolbar from "./components/Toolbar";
import Table from "./components/Table";
import AppForm from "./components/AppForm";
import ConfirmDialog from "./components/ConfirmDialog";
import Login from "./Login";
import type { Application, Schema } from "./types";
import { apiFetch } from "./api";

function App() {
  const [user, setUser] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeState, setActiveState] = useState<string | null>(null);
  const [schema, setSchema] = useState<Schema | null>(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [deletingApp, setDeletingApp] = useState<Application | null>(null);

  useEffect(() => {
    async function checkSession() {
      const res = await apiFetch("/api/auth/session");

      if (res.ok) {
        const data = await res.json();
        setUser(data.username);
      }
      setCheckingSession(false);
    }

    checkSession();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    async function load() {
      const [appsRes, optionsRes] = await Promise.all([
        fetch("http://localhost:8000/applications/"),
        fetch("http://localhost:8000/applications/", { method: "OPTIONS" }),
      ]);

      if (appsRes.status === 401 || optionsRes.status === 401) {
        setUser(null);
        return;
      }

      const apps: Application[] = await appsRes.json();
      const meta = await optionsRes.json();

      setApplications(apps);
      setSchema(meta.actions.POST);
    }

    load();
  }, [user]);

  async function handleDelete() {
    if (!deletingApp) return;

    const res = await fetch(
      `http://localhost:8000/applications/${deletingApp.id}/`,
      { method: "DELETE" },
    );

    if (res.status === 401) {
      setUser(null);
      return;
    }

    if (!res.ok) {
      return;
    }

    setApplications(applications.filter((a) => a.id !== deletingApp.id));
    setDeletingApp(null);
  }

  async function handleStateChange(app: Application, newState: string) {
    const previousState = app.state;
    setApplications((prev) =>
      prev.map((a) =>
        a.id === app.id ? { ...a, state: newState as Application["state"] } : a,
      ),
    );

    try {
      const res = await fetch(`http://localhost:8000/applications/${app.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: newState }),
      });

      if (!res.ok) {
        throw new Error("state update failed");
      }

      const updated: Application = await res.json();
      setApplications((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a)),
      );
    } catch {
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, state: previousState } : a)),
      );
    }
  }

  async function handleLogout() {
    await apiFetch("/api/auth/logout/", { method: "POST" });
    setUser(null);
  }

  return (
    <>
      {checkingSession ? null : !user ? (
        <Login onLogin={setUser} />
      ) : (
        <div className="max-w-270 mx-auto px-6 py-10 sm:px-8 lg:px-12">
          <Header
            username={user}
            onAddClick={() => setShowForm(true)}
            onLogout={handleLogout}
          />
          {schema && (
            <>
              <StatusTiles
                applications={applications}
                stateChoices={schema.state.choices ?? []}
                activeState={activeState}
                onSelect={setActiveState}
              />
              <Toolbar
                search={search}
                onSearchChange={setSearch}
                activeState={activeState}
                onClearFilter={() => setActiveState(null)}
              />
              <Table
                applications={applications}
                schema={schema}
                onEdit={setEditingApp}
                onDelete={setDeletingApp}
                onStateChange={handleStateChange}
              />
            </>
          )}
          {showForm && (
            <AppForm
              schema={schema}
              onClose={() => setShowForm(false)}
              onCreated={(app) => setApplications([...applications, app])}
            />
          )}
          {editingApp && (
            <AppForm
              schema={schema}
              application={editingApp}
              onClose={() => setEditingApp(null)}
              onUpdated={(updated) =>
                setApplications(
                  applications.map((a) => (a.id === updated.id ? updated : a)),
                )
              }
            />
          )}
          {deletingApp && (
            <ConfirmDialog
              title="Delete Application?"
              message={`Delete "${deletingApp.title}" at ${deletingApp.company}? This cannot be undone.`}
              confirmLabel="Delete"
              onConfirm={handleDelete}
              onClose={() => setDeletingApp(null)}
            />
          )}
        </div>
      )}
    </>
  );
}

export default App;
