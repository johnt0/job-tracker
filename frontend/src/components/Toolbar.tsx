interface ToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  activeState: string | null;
  onClearFilter: () => void;
}

function Toolbar({
  search,
  onSearchChange,
  onClearFilter,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onClearFilter}
        className="text-xs border border-rule font-semibold rounded-[999px] px-3 py-1 cursor-pointer press"
      >
        All
      </button>
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search title or company..."
        className="flex-1 border border-rule rounded-lg px-3 py-1.5 text-sm outline-none"
      />
    </div>
  );
}

export default Toolbar;
