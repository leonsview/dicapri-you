import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  rightElement?: React.ReactNode;
}

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, type, rightElement, ...props }, ref) => {
    return (
      <div className={cn("glass-input-wrap", className)}>
        <div className="glass-input">
          <input
            type={type}
            ref={ref}
            className={rightElement ? "pr-8" : undefined}
            {...props}
          />
          {rightElement && (
            <div className="flex-shrink-0 pr-3 z-10">
              {rightElement}
            </div>
          )}
          <div className="glass-input-text-area" />
        </div>
        <div className="glass-input-shadow" />
      </div>
    );
  }
);
GlassInput.displayName = "GlassInput";

export { GlassInput };
