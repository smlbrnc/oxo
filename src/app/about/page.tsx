import { HeaderMenu } from "@/components/header-menu";
import { Footer } from "@/components/footer";
import {
  AppShell,
  AppShellMain,
  Container,
  Title,
  Stack,
  Text,
  Paper,
} from "@mantine/core";

export default function AboutPage() {
  return (
    <AppShell header={{ height: 110 }} padding={0}>
      <HeaderMenu />
      <AppShellMain className="pt-4">
        <Container size="xl">
          <Stack gap="xl">
            <Title order={1}>Hakkında</Title>

            <Paper p="lg" withBorder>
              <Stack gap="md">
                <Title order={2}>Crypto Data Viewer</Title>
                <Text>
                  Bu uygulama, kripto para piyasalarındaki coin'lerin fiyat bilgilerini,
                  market cap verilerini ve diğer önemli metrikleri görüntülemenizi sağlar.
                </Text>

                <Title order={3}>Özellikler</Title>
                <Stack gap="sm">
                  <Text>• 20+ popüler kripto para birimi verileri</Text>
                  <Text>• Gerçek zamanlı fiyat takibi (mock data)</Text>
                  <Text>• Arama ve filtreleme özellikleri</Text>
                  <Text>• Favori coin'leri kaydetme</Text>
                  <Text>• Detaylı coin bilgileri</Text>
                  <Text>• Responsive tasarım</Text>
                  <Text>• Dark mode desteği</Text>
                </Stack>

                <Title order={3}>Teknolojiler</Title>
                <Text>
                  Bu proje Next.js 15, Mantine UI ve TailwindCSS kullanılarak
                  geliştirilmiştir.
                </Text>
              </Stack>
            </Paper>
            <Footer />
          </Stack>
        </Container>
      </AppShellMain>
    </AppShell>
  );
}
