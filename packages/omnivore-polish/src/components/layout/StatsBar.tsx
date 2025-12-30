interface StatsBarProps {
  totalItems: number;
  savedItems: number;
  archivedItems: number;
}

const StatsBar = ({ totalItems, savedItems, archivedItems }: StatsBarProps) => {
  return (
    <div className="flex items-center justify-center gap-12 py-4 bg-card rounded-lg mb-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-foreground">{totalItems}</div>
        <div className="text-caption uppercase tracking-wide text-muted-foreground">Total Items</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-foreground">{savedItems}</div>
        <div className="text-caption uppercase tracking-wide text-muted-foreground">Saved</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-foreground">{archivedItems}</div>
        <div className="text-caption uppercase tracking-wide text-muted-foreground">Archived</div>
      </div>
    </div>
  );
};

export default StatsBar;
