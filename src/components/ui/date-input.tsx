import { forwardRef, InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";

export const DateInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>((props, ref) => <Input ref={ref} type="date" {...props} />);

DateInput.displayName = "DateInput";
