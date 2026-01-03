"use client";

import {
  Container,
  Title,
  Text,
  Group,
  Stack,
  Paper,
  Badge,
  Button,
  Grid,
  Table,
  Avatar,
} from "@mantine/core";
import { IconStar, IconStarFilled } from "@tabler/icons-react";
import { CryptoCoin, PriceHistory } from "@/lib/types";
import {
  formatCurrency,
  formatLargeNumber,
  formatPercentage,
  isFavorite,
  toggleFavorite,
} from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";

interface CoinDetailProps {
  coin: CryptoCoin;
}

export function CoinDetail({ coin }: CoinDetailProps) {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadFavoriteStatus();
    } else {
      setIsFav(false);
    }
  }, [user?.id, coin.id]);

  const loadFavoriteStatus = async () => {
    if (!user?.id) return;
    const favorite = await isFavorite(user.id, coin.id);
    setIsFav(favorite);
  };

  const handleToggleFavorite = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      await toggleFavorite(user.id, coin.id);
      setIsFav((prev) => !prev);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setLoading(false);
    }
  };

  const isPositive = coin.price_change_percentage_24h >= 0;

  // Mock price history data
  const priceHistory: PriceHistory[] = [
    { date: "2024-01-01", price: coin.current_price * 0.95 },
    { date: "2024-01-02", price: coin.current_price * 0.97 },
    { date: "2024-01-03", price: coin.current_price * 0.99 },
    { date: "2024-01-04", price: coin.current_price },
  ];

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Group gap="md">
            <Avatar src={coin.image} alt={coin.name} size="xl" />
            <Stack gap={4}>
              <Group gap="sm">
                <Title order={1}>{coin.name}</Title>
                <Badge size="lg" variant="light" tt="uppercase">
                  {coin.symbol}
                </Badge>
                <Badge
                  size="lg"
                  color={isPositive ? "green" : "red"}
                  variant="light"
                >
                  {formatPercentage(coin.price_change_percentage_24h)}
                </Badge>
              </Group>
              <Text c="dimmed" size="sm">
                Market Cap Rank: #{coin.market_cap_rank}
              </Text>
            </Stack>
          </Group>
          {user?.id ? (
            <Button
              leftSection={isFav ? <IconStarFilled size={18} /> : <IconStar size={18} />}
              variant={isFav ? "filled" : "outline"}
              color={isFav ? "yellow" : "gray"}
              onClick={handleToggleFavorite}
              loading={loading}
              disabled={loading}
            >
              {isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
            </Button>
          ) : null}
        </Group>

        {/* Price Info */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Text size="xl" fw={700}>
              {formatCurrency(coin.current_price)}
            </Text>
            <Group gap="lg">
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  24s Yüksek
                </Text>
                <Text fw={500}>{formatCurrency(coin.high_24h)}</Text>
              </Stack>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  24s Düşük
                </Text>
                <Text fw={500}>{formatCurrency(coin.low_24h)}</Text>
              </Stack>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  Değişim (24s)
                </Text>
                <Text fw={500} c={isPositive ? "green" : "red"}>
                  {formatCurrency(coin.price_change_24h)} (
                  {formatPercentage(coin.price_change_percentage_24h)})
                </Text>
              </Stack>
            </Group>
          </Stack>
        </Paper>

        {/* Stats Grid */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper p="md" withBorder>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  Market Cap
                </Text>
                <Text fw={600}>{formatLargeNumber(coin.market_cap)}</Text>
              </Stack>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper p="md" withBorder>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  Toplam Hacim
                </Text>
                <Text fw={600}>{formatLargeNumber(coin.total_volume)}</Text>
              </Stack>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper p="md" withBorder>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  Dolaşımdaki Arz
                </Text>
                <Text fw={600}>
                  {coin.circulating_supply.toLocaleString()} {coin.symbol.toUpperCase()}
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper p="md" withBorder>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  Toplam Arz
                </Text>
                <Text fw={600}>
                  {coin.total_supply
                    ? `${coin.total_supply.toLocaleString()} ${coin.symbol.toUpperCase()}`
                    : "N/A"}
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* All Time High/Low */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper p="md" withBorder>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  Tüm Zamanların En Yükseği (ATH)
                </Text>
                <Text fw={600} size="lg">
                  {formatCurrency(coin.ath)}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatPercentage(coin.ath_change_percentage)} (
                  {new Date(coin.ath_date).toLocaleDateString("tr-TR")})
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper p="md" withBorder>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  Tüm Zamanların En Düşüğü (ATL)
                </Text>
                <Text fw={600} size="lg">
                  {formatCurrency(coin.atl)}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatPercentage(coin.atl_change_percentage)} (
                  {new Date(coin.atl_date).toLocaleDateString("tr-TR")})
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Price History Table */}
        <Paper p="lg" withBorder>
          <Title order={3} mb="md">
            Fiyat Geçmişi
          </Title>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Tarih</Table.Th>
                <Table.Th>Fiyat</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {priceHistory.map((entry, index) => (
                <Table.Tr key={index}>
                  <Table.Td>{new Date(entry.date).toLocaleDateString("tr-TR")}</Table.Td>
                  <Table.Td>{formatCurrency(entry.price)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      </Stack>
    </Container>
  );
}
