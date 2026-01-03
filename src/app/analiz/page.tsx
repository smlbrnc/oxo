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
  SimpleGrid,
  Avatar,
} from "@mantine/core";
import { IconArrowUpRight, IconArrowDownRight } from "@tabler/icons-react";
import { mockCryptoData } from "@/lib/mock-data";
import { getAnalysisData } from "@/lib/analysis-data";
import { getFavoritesCoins, formatCurrency, formatLargeNumber, formatPercentage, formatNumber } from "@/lib/utils";
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

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {favorites.map((coin) => {
                const isPositive = coin.price_change_percentage_24h >= 0;
                const changeColor = isPositive ? "green" : "red";
                const analysis = getAnalysisData(coin.id, coin.current_price);

                return (
                  <Paper
                    key={coin.id}
                    p="lg"
                    withBorder
                    radius="md"
                    className="h-full"
                  >
                    <Stack gap="lg">
                      {/* Header */}
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Group gap="sm" wrap="nowrap">
                          <Avatar src={coin.image} alt={coin.name} size={50} />
                          <Stack gap={2}>
                            <Text fw={700} size="md" lineClamp={1}>
                              {coin.name}
                            </Text>
                            <Badge variant="light" tt="uppercase" size="sm" w="fit-content">
                              {coin.symbol}
                            </Badge>
                          </Stack>
                        </Group>
                        <Badge
                          color={changeColor}
                          variant="light"
                          size="md"
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

                      {/* Price */}
                      <Stack gap={2}>
                        <Text size="xs" c="dimmed" fw={500}>
                          Fiyat
                        </Text>
                        <Text fw={700} size="xl">
                          {analysis?.price ? formatCurrency(analysis.price.value) : formatCurrency(coin.current_price)}
                        </Text>
                      </Stack>

                      {/* Analysis Data */}
                      {analysis && (
                        <>
                          {/* RSI */}
                          <Stack gap={2}>
                            <Text size="xs" c="dimmed" fw={500}>
                              RSI
                            </Text>
                            <Text fw={600} size="sm">
                              {formatNumber(analysis.rsi.value, 2)}
                            </Text>
                          </Stack>

                          {/* EMA */}
                          <Stack gap={2}>
                            <Text size="xs" c="dimmed" fw={500}>
                              EMA
                            </Text>
                            <Text fw={600} size="sm">
                              {formatCurrency(analysis.ema.value)}
                            </Text>
                          </Stack>

                          {/* Movement Index */}
                          <Stack gap={2}>
                            <Text size="xs" c="dimmed" fw={500}>
                              Movement Index
                            </Text>
                            <SimpleGrid cols={3} spacing="xs">
                              <Stack gap={1}>
                                <Text size="xs" c="dimmed">
                                  ADX
                                </Text>
                                <Text fw={600} size="xs">
                                  {formatNumber(analysis.movementIndex.adx, 2)}
                                </Text>
                              </Stack>
                              <Stack gap={1}>
                                <Text size="xs" c="dimmed">
                                  PDI
                                </Text>
                                <Text fw={600} size="xs">
                                  {formatNumber(analysis.movementIndex.pdi, 2)}
                                </Text>
                              </Stack>
                              <Stack gap={1}>
                                <Text size="xs" c="dimmed">
                                  MDI
                                </Text>
                                <Text fw={600} size="xs">
                                  {formatNumber(analysis.movementIndex.mdi, 2)}
                                </Text>
                              </Stack>
                            </SimpleGrid>
                          </Stack>

                          {/* Candle Data */}
                          <Stack gap={2}>
                            <Text size="xs" c="dimmed" fw={500}>
                              Candle
                            </Text>
                            <SimpleGrid cols={2} spacing="xs">
                              <Stack gap={1}>
                                <Text size="xs" c="dimmed">
                                  Açılış
                                </Text>
                                <Text fw={600} size="xs">
                                  {formatCurrency(analysis.candle.open)}
                                </Text>
                              </Stack>
                              <Stack gap={1}>
                                <Text size="xs" c="dimmed">
                                  Kapanış
                                </Text>
                                <Text fw={600} size="xs">
                                  {formatCurrency(analysis.candle.close)}
                                </Text>
                              </Stack>
                              <Stack gap={1}>
                                <Text size="xs" c="dimmed">
                                  Yüksek
                                </Text>
                                <Text fw={600} size="xs" c="green">
                                  {formatCurrency(analysis.candle.high)}
                                </Text>
                              </Stack>
                              <Stack gap={1}>
                                <Text size="xs" c="dimmed">
                                  Düşük
                                </Text>
                                <Text fw={600} size="xs" c="red">
                                  {formatCurrency(analysis.candle.low)}
                                </Text>
                              </Stack>
                            </SimpleGrid>
                            <Stack gap={1} mt="xs">
                              <Text size="xs" c="dimmed">
                                Hacim
                              </Text>
                              <Text fw={600} size="xs">
                                {formatNumber(analysis.candle.volume, 2)}
                              </Text>
                            </Stack>
                            <Text size="xs" c="dimmed" mt="xs">
                              {analysis.candle.timestampHuman}
                            </Text>
                          </Stack>
                        </>
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </SimpleGrid>

            <Footer />
          </Stack>
        </Container>
      </AppShellMain>
    </AppShell>
  );
}
