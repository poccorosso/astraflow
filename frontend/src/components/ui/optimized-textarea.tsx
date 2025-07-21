import * as React from "react";
import { cn } from "@/lib/utils";

interface OptimizedTextareaProps extends React.ComponentProps<"textarea"> {
  onValueChange?: (value: string) => void;
  onCompositionStart?: () => void;
  onCompositionEnd?: () => void;
}

const OptimizedTextarea = React.memo(
  React.forwardRef<HTMLTextAreaElement, OptimizedTextareaProps>(
    ({ className, onValueChange, onChange, onCompositionStart, onCompositionEnd, ...props }, ref) => {
      const handleChange = React.useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          const value = e.target.value;
          if (onValueChange) {
            onValueChange(value);
          }
          if (onChange) {
            onChange(e);
          }
        },
        [onValueChange, onChange]
      );

      return (
        <textarea
          ref={ref}
          data-slot="textarea"
          className={cn(
            "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          onChange={handleChange}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          data-gramm="false"
          data-gramm_editor="false"
          data-enable-grammarly="false"
          {...props}
        />
      );
    }
  )
);

OptimizedTextarea.displayName = "OptimizedTextarea";

export { OptimizedTextarea };
