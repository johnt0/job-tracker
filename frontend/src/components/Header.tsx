interface HeaderProps {
  onAddClick: () => void;
}

function Header({ onAddClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 flex-wrap">
      <h1 className="font-semibold font-display text-lg">Job Tracker</h1>
      <button onClick={onAddClick} className="btn-primary press">
        + Add Application
      </button>
    </header>
  );
}

export default Header;
