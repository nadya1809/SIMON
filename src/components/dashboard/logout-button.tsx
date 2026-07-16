"use client";

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { normalizeCallbackPath } from "@/lib/auth-callback";

type LogoutButtonProps = {
  icon?: IconDefinition;
};

export function LogoutButton({ icon }: LogoutButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      icon={icon}
      onClick={async () => {
        const absoluteCallbackUrl = new URL(
          "/login",
          window.location.origin
        ).toString();
        const result = await signOut({
          callbackUrl: absoluteCallbackUrl,
          redirect: false
        });

        window.location.assign(normalizeCallbackPath(result.url, "/login"));
      }}
    >
      Keluar
    </Button>
  );
}
