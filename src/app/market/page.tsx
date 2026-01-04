"use client";

import { HeaderMenu } from "@/components/header-menu";
import { Footer } from "@/components/footer";
import { CryptoChart } from "@/components/crypto-chart";
import {
  AppShell,
  AppShellMain,
  Container,
  Title,
  Stack,
  Text,
  Paper,
  Group,
  Select,
  Table,
  Badge,
  Skeleton,
  Alert,
  Grid,
  Divider,
  Avatar,
  Button,
} from "@mantine/core";
import { IconAlertCircle, IconArrowUpRight, IconArrowDownRight, IconStar, IconStarFilled } from "@tabler/icons-react";
import { getTicker24hr, getOrderBook, getRecentTrades, createBinanceWebSocket, symbolToBinancePair, tickerToCryptoCoin, getTickerWithWindowSize } from "@/lib/binance";
import { BinanceTicker24hr, BinanceOrderBook, BinanceTrade } from "@/lib/types";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { formatCurrency, formatPercentage, formatLargeNumber, isFavorite, toggleFavorite } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

const POPULAR_SYMBOLS = [
  { value: "BTCUSDT", label: "BTC/USDT" },
  { value: "ETHUSDT", label: "ETH/USDT" },
  { value: "BNBUSDT", label: "BNB/USDT" },
  { value: "SOLUSDT", label: "SOL/USDT" },
  { value: "ADAUSDT", label: "ADA/USDT" },
  { value: "XRPUSDT", label: "XRP/USDT" },
  { value: "DOGEUSDT", label: "DOGE/USDT" },
  { value: "DOTUSDT", label: "DOT/USDT" },
];

const INTERVALS = [
  { value: "1h", label: "1h", displayLabel: "1 Saatlik" },
  { value: "4h", label: "4h", displayLabel: "4 Saatlik" },
  { value: "6h", label: "6h", displayLabel: "6 Saatlik" },
  { value: "12h", label: "12h", displayLabel: "12 Saatlik" },
  { value: "1d", label: "1d", displayLabel: "1 Günlük" },
];

export default function MarketPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTCUSDT");
  const [selectedInterval, setSelectedInterval] = useState<string>("4h");
  const [ticker, setTicker] = useState<BinanceTicker24hr | null>(null);
  const [intervalTicker, setIntervalTicker] = useState<BinanceTicker24hr | null>(null);
  const [orderBook, setOrderBook] = useState<BinanceOrderBook | null>(null);
  const [trades, setTrades] = useState<BinanceTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const tradesBufferRef = useRef<BinanceTrade[]>([]);

  // Client-side only render için
  useEffect(() => {
    setMounted(true);
  }, []);

  // URL'den symbol parametresini oku
  useEffect(() => {
    const symbolParam = searchParams.get("symbol");
    if (symbolParam) {
      // Eğer zaten USDT formatında değilse, dönüştür
      const binanceSymbol = symbolParam.toUpperCase().endsWith("USDT") 
        ? symbolParam.toUpperCase() 
        : symbolToBinancePair(symbolParam);
      setSelectedSymbol(binanceSymbol);
    }
  }, [searchParams]);

  // İlk yükleme - REST API ile
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [tickerData, orderBookData, tradesData] = await Promise.all([
        getTicker24hr(selectedSymbol),
        getOrderBook(selectedSymbol, 20),
        getRecentTrades(selectedSymbol, 20),
      ]);
      
      setTicker(tickerData);
      setOrderBook(orderBookData);
      setTrades(tradesData);
      tradesBufferRef.current = tradesData;
    } catch (err) {
      console.error("Error loading market data:", err);
      setError(err instanceof Error ? err.message : "Market verileri yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    // İlk yükleme - REST API ile snapshot al
    loadInitialData();

    // Eski WebSocket bağlantısını kapat
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // WebSocket bağlantısı oluştur - API'den veri geldikçe güncelle
    const ws = createBinanceWebSocket(selectedSymbol, {
      onTicker: (data) => {
        // Ticker verileri API'den geldikçe güncelle
        setTicker(data);
      },
      onDepth: (data) => {
        // Depth güncellemeleri API'den geldikçe orderbook'u güncelle
        setOrderBook((prev) => {
          // İlk yükleme tamamlanmamışsa snapshot'ı kullan
          if (!prev) {
            return data;
          }
          // Incremental update - yeni verilerle güncelle
          return {
            lastUpdateId: data.lastUpdateId,
            bids: data.bids.length > 0 ? data.bids : prev.bids,
            asks: data.asks.length > 0 ? data.asks : prev.asks,
          };
        });
      },
      onTrade: (data) => {
        // Yeni trade API'den geldikçe listenin başına ekle
        setTrades((prev) => {
          const newTrades = [data, ...prev].slice(0, 20);
          return newTrades;
        });
      },
      onError: (error) => {
        console.error("WebSocket error:", error);
        setError("WebSocket bağlantısında bir hata oluştu");
      },
    });

    wsRef.current = ws;

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [selectedSymbol, loadInitialData]);

  // Zaman aralığına göre ticker verisini çek
  useEffect(() => {
    const fetchIntervalTicker = async () => {
      if (!selectedSymbol || !selectedInterval) return;
      
      try {
        const data = await getTickerWithWindowSize(selectedSymbol, selectedInterval);
        setIntervalTicker(data);
      } catch (error) {
        console.error("Error fetching interval ticker:", error);
        setIntervalTicker(null);
      }
    };

    fetchIntervalTicker();
  }, [selectedSymbol, selectedInterval]);

  const priceChange = useMemo(() => {
    // Önce interval'a göre değişim yüzdesini kullan, yoksa ticker'dan al
    if (intervalTicker) {
      return parseFloat(intervalTicker.priceChangePercent);
    }
    return ticker ? parseFloat(ticker.priceChangePercent) : 0;
  }, [intervalTicker, ticker?.priceChangePercent]);

  // İstatistikler için kullanılacak ticker (interval varsa onu kullan, yoksa 24h ticker)
  const displayTicker = useMemo(() => {
    return intervalTicker || ticker;
  }, [intervalTicker, ticker]);
  
  const isPositive = useMemo(() => priceChange >= 0, [priceChange]);

  // Coin bilgilerini ticker'dan oluştur
  const coinData = useMemo(() => {
    if (!ticker) return null;
    return tickerToCryptoCoin(ticker, 0);
  }, [ticker]);

  // Favori durumunu yükle
  useEffect(() => {
    if (user?.id && coinData?.id) {
      loadFavoriteStatus();
    } else {
      setIsFav(false);
    }
  }, [user?.id, coinData?.id]);

  const loadFavoriteStatus = async () => {
    if (!user?.id || !coinData?.id) return;
    const favorite = await isFavorite(user.id, coinData.id);
    setIsFav(favorite);
  };

  const handleToggleFavorite = async () => {
    if (!user?.id || !coinData?.id) return;
    
    setFavoriteLoading(true);
    try {
      await toggleFavorite(user.id, coinData.id);
      setIsFav((prev) => !prev);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <AppShell header={{ height: 110 }} padding={0}>
      <HeaderMenu />
      <AppShellMain className="pt-4">
        <Container size="xl">
          <Stack gap="xl">
            {/* Coin Header */}
            {loading ? (
              <Paper p="md" radius="md">
                <Group justify="space-between" align="flex-start">
                  <Group gap="md">
                    <Skeleton height={64} circle />
                    <Stack gap={4}>
                      <Skeleton height={28} width={200} />
                      <Skeleton height={20} width={150} />
                    </Stack>
                  </Group>
                  <Skeleton height={36} width={150} />
                </Group>
              </Paper>
            ) : coinData ? (
              <Paper p="md" radius="md">
                <Group justify="space-between" align="flex-start">
                  <Group gap="md">
                    <Avatar src={coinData.image} alt={coinData.name} size="xl" />
                    <Stack gap={4}>
                      <Group gap="sm">
                        <Title order={2}>{coinData.name}</Title>
                        <Badge size="lg" variant="light" tt="uppercase">
                          {coinData.symbol}
                        </Badge>
                        <Badge
                          size="lg"
                          color={isPositive ? "green" : "red"}
                          variant="light"
                        >
                          {formatPercentage(priceChange)}
                        </Badge>
                      </Group>
                      <Text c="dimmed" size="sm">
                        {formatCurrency(coinData.current_price)}
                      </Text>
                    </Stack>
                  </Group>
                  {user?.id && (
                    <Button
                      leftSection={isFav ? <IconStarFilled size={18} /> : <IconStar size={18} />}
                      variant={isFav ? "filled" : "outline"}
                      color={isFav ? "yellow" : "gray"}
                      onClick={handleToggleFavorite}
                      loading={favoriteLoading}
                      disabled={favoriteLoading}
                    >
                      {isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                    </Button>
                  )}
                </Group>
              </Paper>
            ) : null}

            {/* Error Alert */}
            {error && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Hata"
                color="red"
                variant="light"
              >
                {error}
              </Alert>
            )}

            {/* Ticker Data */}
            <Paper p="md" withBorder radius="md">
              <Stack gap="md">
                <Title order={3}>
                  {INTERVALS.find((i) => i.value === selectedInterval)?.displayLabel || "24 Saatlik"} İstatistikler
                </Title>
                {loading ? (
                  <Stack gap="sm">
                    <Skeleton height={20} />
                    <Skeleton height={20} width="80%" />
                    <Skeleton height={20} width="90%" />
                  </Stack>
                ) : displayTicker ? (
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Stack gap={4}>
                        <Text size="xs" c="dimmed">
                          Fiyat
                        </Text>
                        <Text fw={700} size="xl">
                          {formatCurrency(parseFloat(displayTicker.lastPrice))}
                        </Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Stack gap={4}>
                        <Text size="xs" c="dimmed">
                          Değişim
                        </Text>
                        <Group gap="xs" align="center">
                          {isPositive ? (
                            <IconArrowUpRight size={16} color="var(--mantine-color-green-6)" />
                          ) : (
                            <IconArrowDownRight size={16} color="var(--mantine-color-red-6)" />
                          )}
                          <Text
                            fw={600}
                            size="lg"
                            c={isPositive ? "green" : "red"}
                          >
                            {formatPercentage(priceChange)}
                          </Text>
                        </Group>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Stack gap={4}>
                        <Text size="xs" c="dimmed">
                          Yüksek
                        </Text>
                        <Text fw={600} size="md" c="green">
                          {formatCurrency(parseFloat(displayTicker.highPrice))}
                        </Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Stack gap={4}>
                        <Text size="xs" c="dimmed">
                          Düşük
                        </Text>
                        <Text fw={600} size="md" c="red">
                          {formatCurrency(parseFloat(displayTicker.lowPrice))}
                        </Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Stack gap={4}>
                        <Text size="xs" c="dimmed">
                          Hacim
                        </Text>
                        <Text fw={600} size="md">
                          {formatLargeNumber(parseFloat(displayTicker.volume))}
                        </Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Stack gap={4}>
                        <Text size="xs" c="dimmed">
                          Alış Fiyatı (Bid)
                        </Text>
                        <Text fw={600} size="md">
                          {formatCurrency(parseFloat(displayTicker.bidPrice))}
                        </Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Stack gap={4}>
                        <Text size="xs" c="dimmed">
                          Satış Fiyatı (Ask)
                        </Text>
                        <Text fw={600} size="md">
                          {formatCurrency(parseFloat(displayTicker.askPrice))}
                        </Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Stack gap={4}>
                        <Text size="xs" c="dimmed">
                          Ortalama Fiyat
                        </Text>
                        <Text fw={600} size="md">
                          {formatCurrency(parseFloat(displayTicker.weightedAvgPrice))}
                        </Text>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                ) : null}
              </Stack>
            </Paper>

            {/* Chart */}
            <Paper p="md" withBorder radius="md">
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Title order={3}>Fiyat Grafiği</Title>
                  {mounted && (
                    <Group gap="xs">
                      {INTERVALS.map((interval) => (
                        <Button
                          key={interval.value}
                          variant={selectedInterval === interval.value ? "filled" : "outline"}
                          size="sm"
                          onClick={() => setSelectedInterval(interval.value)}
                        >
                          {interval.label}
                        </Button>
                      ))}
                    </Group>
                  )}
                </Group>
                {mounted ? (
                  <CryptoChart symbol={selectedSymbol} interval={selectedInterval} />
                ) : (
                  <Skeleton height={500} />
                )}
              </Stack>
            </Paper>

            <Grid>
              {/* Order Book */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="md" withBorder radius="md">
                  <Stack gap="md">
                    <Title order={3}>Orderbook (Alış/Satış)</Title>
                    {loading ? (
                      <Stack gap="xs">
                        {[...Array(10)].map((_, i) => (
                          <Skeleton key={i} height={24} />
                        ))}
                      </Stack>
                    ) : orderBook ? (
                      <Stack gap="xs">
                        {/* Asks (Satış) */}
                        <Text size="sm" fw={600} c="red">
                          Satış (Asks)
                        </Text>
                        <Table>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>Fiyat</Table.Th>
                              <Table.Th>Miktar</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {orderBook.asks.slice(0, 10).reverse().map((ask, index) => (
                              <Table.Tr key={index}>
                                <Table.Td c="red" fw={500}>
                                  {formatCurrency(parseFloat(ask[0]))}
                                </Table.Td>
                                <Table.Td>{parseFloat(ask[1]).toFixed(4)}</Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>

                        <Divider />

                        {/* Bids (Alış) */}
                        <Text size="sm" fw={600} c="green">
                          Alış (Bids)
                        </Text>
                        <Table>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>Fiyat</Table.Th>
                              <Table.Th>Miktar</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {orderBook.bids.slice(0, 10).map((bid, index) => (
                              <Table.Tr key={index}>
                                <Table.Td c="green" fw={500}>
                                  {formatCurrency(parseFloat(bid[0]))}
                                </Table.Td>
                                <Table.Td>{parseFloat(bid[1]).toFixed(4)}</Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      </Stack>
                    ) : null}
                  </Stack>
                </Paper>
              </Grid.Col>

              {/* Recent Trades */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="md" withBorder radius="md">
                  <Stack gap="md">
                    <Title order={3}>Son İşlemler</Title>
                    {loading ? (
                      <Stack gap="xs">
                        {[...Array(10)].map((_, i) => (
                          <Skeleton key={i} height={24} />
                        ))}
                      </Stack>
                    ) : trades.length > 0 ? (
                      <Table>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Fiyat</Table.Th>
                            <Table.Th>Miktar</Table.Th>
                            <Table.Th>Zaman</Table.Th>
                            <Table.Th>Tip</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {trades.slice(0, 20).map((trade) => (
                            <Table.Tr key={trade.id}>
                              <Table.Td fw={500}>
                                {formatCurrency(parseFloat(trade.price))}
                              </Table.Td>
                              <Table.Td>{parseFloat(trade.qty).toFixed(4)}</Table.Td>
                              <Table.Td>
                                {new Date(trade.time).toLocaleTimeString("tr-TR")}
                              </Table.Td>
                              <Table.Td>
                                <Badge
                                  color={trade.isBuyerMaker ? "red" : "green"}
                                  variant="light"
                                  size="sm"
                                >
                                  {trade.isBuyerMaker ? "Satış" : "Alış"}
                                </Badge>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    ) : null}
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>

            <Footer />
          </Stack>
        </Container>
      </AppShellMain>
    </AppShell>
  );
}
