import clsx from "clsx";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      className={clsx(
        "rounded-full border-2 border-border border-t-accent animate-spin shrink-0",
        size === "sm" && "w-3.5 h-3.5",
        size === "md" && "w-5 h-5",
        size === "lg" && "w-8 h-8 border-[3px]",
        className
      )}
    />
  );
}
