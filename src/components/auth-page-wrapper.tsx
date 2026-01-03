"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HeaderMenu } from "@/components/header-menu";
import { AppShell, AppShellMain } from "@mantine/core";
import { AuthModal } from "./auth-modal";
import { useDisclosure } from "@mantine/hooks";

type AuthView = "login" | "register" | "forgot-password";

interface AuthPageWrapperProps {
  defaultView: AuthView;
}

export function AuthPageWrapper({ defaultView }: AuthPageWrapperProps) {
  const router = useRouter();
  const [opened, { close }] = useDisclosure(true);

  useEffect(() => {
    if (!opened) {
      router.push("/");
    }
  }, [opened, router]);

  return (
    <AppShell header={{ height: 110 }} padding={0}>
      <HeaderMenu />
      <AppShellMain className="pt-4">
        <AuthModal opened={opened} onClose={close} defaultView={defaultView} />
      </AppShellMain>
    </AppShell>
  );
}
