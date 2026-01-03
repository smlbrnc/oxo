import { HeaderMenu } from "@/components/header-menu";
import { Footer } from "@/components/footer";
import { AppShell, AppShellMain, Container, Title, Text, Button, Stack } from "@mantine/core";
import Link from "next/link";

export default function NotFound() {
  return (
    <AppShell header={{ height: 110 }} padding={0}>
      <HeaderMenu />
      <AppShellMain className="pt-4">
        <Container size="xl">
          <Stack gap="md" align="center" py="xl">
            <Title order={1}>404</Title>
            <Title order={2}>Coin Bulunamadı</Title>
            <Text c="dimmed" ta="center">
              Aradığınız coin bulunamadı. Lütfen ana sayfaya dönün.
            </Text>
            <Button component={Link} href="/" variant="filled">
              Ana Sayfaya Dön
            </Button>
          </Stack>
          <Footer />
        </Container>
      </AppShellMain>
    </AppShell>
  );
}
