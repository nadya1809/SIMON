import { forwardRef, InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const DateInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <Input
    ref={ref}
    type="date"
    className={cn(
      "text-left [color-scheme:dark] [&::-webkit-date-and-time-value]:min-h-[1.25rem] [&::-webkit-date-and-time-value]:text-left [&::-webkit-date-and-time-value]:justify-start [&::-webkit-date-and-time-value]:[text-align:left]",
      className
    )}
    {...props}
  />
));

DateInput.displayName = "DateInput";
