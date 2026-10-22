import { forwardRef } from "react";
import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";

export const buttonStyles = cva(
  "inline-flex shrink-0 items-center justify-center gap-1 sm:gap-2 whitespace-nowrap rounded-control font-medium transition-colors focus-ring disabled:pointer-events-none disabled:opacity-55 select-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg hover:bg-primary-hover",
        accent: "bg-accent text-accent-fg hover:bg-accent-hover",
        danger: "bg-danger text-paper hover:bg-danger-hover",
        outline: "border border-line-strong bg-surface text-fg hover:bg-surface-2",
        soft: "bg-primary-soft text-primary hover:bg-primary-soft/70",
        ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg",
        "danger-soft": "bg-danger-soft text-danger hover:bg-danger-soft/70",
        link: "h-auto p-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-6 sm:h-7 h-7 sm:px-2 text-xs",
        sm: "h-7 sm:h-8 px-2.5 sm:px-3 text-sm",
        md: "h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm",
        lg: "h-9 sm:h-11 px-3 sm:px-5 text-sm sm:text-base",
        icon: "size-10",
        "icon-sm": "size-8",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  }
);

/**
 * <Button variant="primary|accent|danger|outline|soft|ghost|danger-soft|link" size="xs|sm|md|lg|icon|icon-sm"
 *         loading leftIcon rightIcon block as={Link} to="/x" />
 */
const Button = forwardRef(function Button(
  { variant, size, block, loading = false, leftIcon: Left, rightIcon: Right, className, children, disabled, as: Comp = "button", type, ...props },
  ref
) {
  const isButton = Comp === "button";
  return (
    <Comp
      ref={ref}
      {...(isButton ? { type: type || "button", disabled: disabled || loading } : { "aria-disabled": disabled || loading || undefined })}
      aria-busy={loading || undefined}
      className={cn(buttonStyles({ variant, size, block }), className)}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : Left ? <Left className="size-4" aria-hidden /> : null}
      {children}
      {!loading && Right ? <Right className="size-4" aria-hidden /> : null}
    </Comp>
  );
});

export const IconButton = forwardRef(function IconButton({ label, size = "icon", variant = "ghost", className, children, ...props }, ref) {
  return (
    <Button ref={ref} variant={variant} size={size} aria-label={label} title={label} className={className} {...props}>
      {children}
    </Button>
  );
});

export default Button;
