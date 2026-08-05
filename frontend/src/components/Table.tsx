import StatePill from "./StatePill";
import type { Application, Schema } from "../types";

interface ActionButtonProps {
  name: string;
  onClick: () => void;
}

function ActionButton({ name, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="border border-rule rounded-lg text-ink-soft px-[0.55rem] py-[0.15rem] cursor-pointer press"
    >
      {name}
    </button>
  );
}

interface TableProps {
  applications: Application[];
  schema: Schema;
  onEdit: (app: Application) => void;
  onDelete: (app: Application) => void;
  onStateChange: (app: Application, newState: string) => void;
}

function Table({
  applications,
  schema,
  onEdit,
  onDelete,
  onStateChange,
}: TableProps) {
  const columns = Object.entries(schema)
    .filter(([key]) => key != "id")
    .map(([key, field]) => ({ key, label: field.label }))
    .concat({ key: "actions", label: "Actions" });

  return (
    <table className="mt-4 w-full text-sm font-body">
      <thead className="border-t border-rule">
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              className="px-3 py-2 text-left text-xs font-bold uppercase text-ink-soft"
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {applications.map((app) => (
          <tr key={app.id} className="border-t border-rule">
            {columns.map((col) => (
              <td key={col.key} className="px-3 py-2">
                {col.key === "state" ? (
                  <StatePill
                    state={app.state}
                    stateChoices={schema.state.choices ?? []}
                    onChange={(newState) => onStateChange(app, newState)}
                  />
                ) : col.key === "actions" ? (
                  <div className="flex gap-2">
                    <ActionButton name="Edit" onClick={() => onEdit(app)} />
                    <ActionButton
                      name="Delete"
                      onClick={() => onDelete(app)}
                    />
                  </div>
                ) : col.key === "date_applied" ? (
                  <span className="text-ink-soft">{app.date_applied}</span>
                ) : col.key === "link" ? (
                  app.link ? (
                    <a href={app.link} className="text-ink-soft">
                      {app.link}
                    </a>
                  ) : (
                    <span className="text-ink-soft">—</span>
                  )
                ) : (
                  app[col.key as keyof Application]
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Table;
