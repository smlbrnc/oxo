"use client";

import { HeaderMenu } from "@/components/header-menu";
import { Footer } from "@/components/footer";
import { AppShell, AppShellMain, Button, Container } from "@mantine/core";
import { CoinDetail } from "@/components/coin-detail";
import { mockCryptoData } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import { use } from "react";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CoinDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const coin = mockCryptoData.find((c) => c.id === id);

  if (!coin) {
    notFound();
  }

  return (
    <AppShell header={{ height: 110 }} padding={0}>
      <HeaderMenu />
      <AppShellMain className="pt-4">
        <Container size="xl">
          <Button
            component={Link}
            href="/"
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            mb="md"
          >
            Geri Dön
          </Button>
        </Container>
        <CoinDetail coin={coin} />
        <Footer />
      </AppShellMain>
    </AppShell>
  );
}
