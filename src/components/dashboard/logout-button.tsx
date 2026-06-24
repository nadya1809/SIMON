"use client";

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  icon?: IconDefinition;
};

export function LogoutButton({ icon }: LogoutButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      icon={icon}
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Keluar
    </Button>
  );
}
