"use client";

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
  Group,
  Badge,
  Avatar,
  Grid,
  Button,
} from "@mantine/core";
import { IconArrowUpRight, IconArrowDownRight } from "@tabler/icons-react";
import { mockCryptoData } from "@/lib/mock-data";
import { getAnalysisData } from "@/lib/analysis-data";
import { getFavoritesCoins, formatCurrency, formatPercentage, formatNumber } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";
import { CryptoCoin } from "@/lib/types";

export default function AnalizPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<CryptoCoin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadFavorites();
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [user?.id]);

  const loadFavorites = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const favoriteCoins = await getFavoritesCoins(user.id, mockCryptoData);
      setFavorites(favoriteCoins);
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell header={{ height: 110 }} padding={0}>
        <HeaderMenu />
        <AppShellMain className="pt-4">
          <Container size="xl">
            <Stack gap="xl" align="center" py="xl">
              <Text>Yükleniyor...</Text>
            </Stack>
            <Footer />
          </Container>
        </AppShellMain>
      </AppShell>
    );
  }

  if (!user?.id) {
    return (
      <AppShell header={{ height: 110 }} padding={0}>
        <HeaderMenu />
        <AppShellMain className="pt-4">
          <Container size="xl">
            <Stack gap="xl" align="center" py="xl">
              <Title order={2}>Giriş Yapın</Title>
              <Text c="dimmed" ta="center">
                Analiz sayfasını görmek için giriş yapmanız gerekiyor.
              </Text>
            </Stack>
            <Footer />
          </Container>
        </AppShellMain>
      </AppShell>
    );
  }

  if (favorites.length === 0) {
    return (
      <AppShell header={{ height: 110 }} padding={0}>
        <HeaderMenu />
        <AppShellMain className="pt-4">
          <Container size="xl">
            <Stack gap="xl" align="center" py="xl">
              <Title order={2}>Favori Coin Yok</Title>
              <Text c="dimmed" ta="center">
                Analiz yapmak için favorilerinize coin ekleyin.
              </Text>
            </Stack>
            <Footer />
          </Container>
        </AppShellMain>
      </AppShell>
    );
  }

  return (
    <AppShell header={{ height: 110 }} padding={0}>
      <HeaderMenu />
      <AppShellMain className="pt-4">
        <Container size="xl">
          <Stack gap="xl">
            <Title order={1}>Analiz</Title>

            <Stack gap="md">
              {favorites.map((coin) => {
                const isPositive = coin.price_change_percentage_24h >= 0;
                const changeColor = isPositive ? "green" : "red";
                const analysis = getAnalysisData(coin.id, coin.current_price);

                return (
                  <Paper
                    key={coin.id}
                    p="md"
                    withBorder
                    radius="md"
                  >
                    <Grid gutter="md">
                      {/* Grid 1: Coin Info */}
                      <Grid.Col span={{ base: 12, sm: 3 }}>
                        <Group gap="md" wrap="nowrap">
                          <Avatar src={coin.image} alt={coin.name} size={50} />
                          <Stack gap={4}>
                            <Group gap="sm" align="center">
                              <Text fw={700} size="md">
                                {coin.name}
                              </Text>
                              <Badge variant="light" tt="uppercase" size="sm">
                                {coin.symbol}
                              </Badge>
                              <Badge
                                color={changeColor}
                                variant="light"
                                size="sm"
                                leftSection={
                                  isPositive ? (
                                    <IconArrowUpRight size={12} />
                                  ) : (
                                    <IconArrowDownRight size={12} />
                                  )
                                }
                              >
                                {formatPercentage(coin.price_change_percentage_24h)}
                              </Badge>
                            </Group>
                            <Text fw={700} size="xl">
                              {analysis?.price ? formatCurrency(analysis.price.value) : formatCurrency(coin.current_price)}
                            </Text>
                            {analysis && (
                              <Group gap={4} align="center">
                                <Text size="xs" c="dimmed" fw={500}>
                                  Hacim:
                                </Text>
                                <Text fw={600} size="sm">
                                  {formatNumber(analysis.candle.volume, 2)}
                                </Text>
                              </Group>
                            )}
                          </Stack>
                        </Group>
                      </Grid.Col>

                      {/* Grid 2: Analysis Metrics Container */}
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        {analysis && (
                          <Paper p="md" withBorder radius="md" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                            <Group gap="xl" justify="space-between" wrap="nowrap" style={{ width: '100%' }}>
                              {/* RSI */}
                              <Stack gap={2} align="center" style={{ flex: 1 }}>
                                <Text size="xs" c="dimmed" fw={500}>
                                  RSI
                                </Text>
                                <Text fw={600} size="sm">
                                  {formatNumber(analysis.rsi.value, 2)}
                                </Text>
                              </Stack>

                              {/* EMA */}
                              <Stack gap={2} align="center" style={{ flex: 1 }}>
                                <Text size="xs" c="dimmed" fw={500}>
                                  EMA
                                </Text>
                                <Text fw={600} size="sm">
                                  {formatCurrency(analysis.ema.value)}
                                </Text>
                              </Stack>

                              {/* ADX */}
                              <Stack gap={2} align="center" style={{ flex: 1 }}>
                                <Text size="xs" c="dimmed" fw={500}>
                                  ADX
                                </Text>
                                <Text fw={600} size="sm">
                                  {formatNumber(analysis.movementIndex.adx, 2)}
                                </Text>
                              </Stack>

                              {/* PDI */}
                              <Stack gap={2} align="center" style={{ flex: 1 }}>
                                <Text size="xs" c="dimmed" fw={500}>
                                  PDI
                                </Text>
                                <Text fw={600} size="sm">
                                  {formatNumber(analysis.movementIndex.pdi, 2)}
                                </Text>
                              </Stack>

                              {/* MDI */}
                              <Stack gap={2} align="center" style={{ flex: 1 }}>
                                <Text size="xs" c="dimmed" fw={500}>
                                  MDI
                                </Text>
                                <Text fw={600} size="sm">
                                  {formatNumber(analysis.movementIndex.mdi, 2)}
                                </Text>
                              </Stack>
                            </Group>
                          </Paper>
                        )}
                      </Grid.Col>

                      {/* Grid 3: Candle Data */}
                      <Grid.Col span={{ base: 12, sm: 3 }}>
                        {analysis && (
                          <Stack gap={2} align="center" style={{ height: '100%', justifyContent: 'center' }}>
                            <Text size="xs" c="dimmed" fw={500}>
                              Candle
                            </Text>
                            <Group gap="md">
                              <Stack gap={2} align="center">
                                <Text size="xs" c="dimmed">
                                  Açılış
                                </Text>
                                <Text fw={600} size="xs">
                                  {formatCurrency(analysis.candle.open)}
                                </Text>
                                <Text size="xs" c="dimmed" mt={4}>
                                  Yüksek
                                </Text>
                                <Text fw={600} size="xs" c="green">
                                  {formatCurrency(analysis.candle.high)}
                                </Text>
                              </Stack>
                              <Stack gap={2} align="center">
                                <Text size="xs" c="dimmed">
                                  Kapanış
                                </Text>
                                <Text fw={600} size="xs">
                                  {formatCurrency(analysis.candle.close)}
                                </Text>
                                <Text size="xs" c="dimmed" mt={4}>
                                  Düşük
                                </Text>
                                <Text fw={600} size="xs" c="red">
                                  {formatCurrency(analysis.candle.low)}
                                </Text>
                              </Stack>
                            </Group>
                            <Text size="xs" c="dimmed" mt="xs" ta="center">
                              {analysis.candle.timestampHuman}
                            </Text>
                          </Stack>
                        )}
                      </Grid.Col>

                      {/* Grid 4: Buttons */}
                      <Grid.Col span={{ base: 12, sm: 2 }}>
                        <Stack gap="sm" align="center" justify="center" style={{ height: '100%' }}>
                          <Button variant="light" size="sm" fullWidth>
                            Detay
                          </Button>
                          <Button variant="filled" size="sm" fullWidth>
                            Analiz Yap
                          </Button>
                        </Stack>
                      </Grid.Col>
                    </Grid>
                  </Paper>
                );
              })}
            </Stack>

            <Footer />
          </Stack>
        </Container>
      </AppShellMain>
    </AppShell>
  );
}
