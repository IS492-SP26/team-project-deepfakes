"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Zap } from "lucide-react";

export function SubmitButton({ label, icon }: { label: string; icon?: "zap" | "loader" }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing…
        </>
      ) : (
        <>
          {icon === "zap" && <Zap className="h-4 w-4" />}
          {label}
        </>
      )}
    </Button>
  );
}
