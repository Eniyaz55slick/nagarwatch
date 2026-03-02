import { FileX } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "No data found",
  description = "Nothing to show here yet.",
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-bg-secondary border border-border rounded-2xl flex items-center justify-center mb-4">
        {icon || <FileX className="w-6 h-6 text-text-subtle" />}
      </div>
      <p className="text-text font-semibold text-base mb-1">{title}</p>
      <p className="text-text-muted text-sm max-w-xs leading-relaxed">{description}</p>
    </div>
  );
}
