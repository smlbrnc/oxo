"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { HeaderMenu } from "@/components/header-menu";
import { Footer } from "@/components/footer";
import {
  AppShell,
  AppShellMain,
  Container,
  Title,
  Stack,
  Paper,
  Text,
  Badge,
  Loader,
  Alert,
  Grid,
  Avatar,
  Group,
  Progress,
  Divider,
  Box,
} from "@mantine/core";
import { IconAlertCircle, IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import { getCoinsWithSwingIndicators, SwingIndicators } from "@/lib/supabase/indicators";
import { calculateSignal, SignalResult } from "@/lib/signal-engine";
import { createMultiTickerWebSocket, symbolToBinancePair, updateCoinFromTicker } from "@/lib/binance";
import { CryptoCoin } from "@/lib/types";

interface CoinWithIndicators {
  coin: CryptoCoin;
  indicators: SwingIndicators;
}

export default function TradePage() {
  const { user } = useAuth();
  const [signals, setSignals] = useState<SignalResult[]>([]);
  const [coinsWithIndicators, setCoinsWithIndicators] = useState<CoinWithIndicators[]>([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const indicatorsRef = useRef<CoinWithIndicators[]>([]);

  const loadSignals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCoinsWithSwingIndicators();
      setCoinsWithIndicators(data);
      indicatorsRef.current = data; // Store in ref for WebSocket callback
      
      // Calculate signals
      const calculatedSignals = data.map(({ coin, indicators }) =>
        calculateSignal(indicators, coin)
      );
      
      // Filter: only show signals with score ≥55
      const visibleSignals = calculatedSignals.filter((s) => s.showInUI);
      
      // Sort by score (highest first)
      visibleSignals.sort((a, b) => b.score - a.score);
      
      setSignals(visibleSignals);
      
      // Setup WebSocket for price updates
      if (visibleSignals.length > 0) {
        const symbols = visibleSignals.map((s) => symbolToBinancePair(s.coin.symbol));
        
        if (wsRef.current) {
          wsRef.current.close();
        }
        
        const ws = createMultiTickerWebSocket(symbols, {
          onTicker: (symbol, tickerData) => {
            setSignals((prev) =>
              prev.map((signal) => {
                const coinBinanceSymbol = symbolToBinancePair(signal.coin.symbol);
                if (coinBinanceSymbol === symbol) {
                  const updatedCoin = updateCoinFromTicker(signal.coin, tickerData);
                  
                  // Find original indicators for this coin using ref
                  const originalData = indicatorsRef.current.find(
                    (item) => symbolToBinancePair(item.coin.symbol) === symbol
                  );
                  
                  if (originalData) {
                    // Recalculate signal with updated price
                    const recalculatedSignal = calculateSignal(originalData.indicators, updatedCoin);
                    // Only update if still visible (score ≥55)
                    return recalculatedSignal.showInUI ? recalculatedSignal : signal;
                  }
                  
                  // Fallback: just update coin price
                  return { ...signal, coin: updatedCoin };
                }
                return signal;
              })
            );
          },
          onError: (error) => {
            console.error("WebSocket error:", error);
          },
        });
        
        wsRef.current = ws;
      }
    } catch (error) {
      console.error("Error loading signals:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadSignals();
    } else {
      setSignals([]);
      setCoinsWithIndicators([]);
      setLoading(false);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user?.id, loadSignals]);


  if (!user) {
    return (
      <AppShell header={{ height: 110 }} padding={0}>
        <HeaderMenu />
        <AppShellMain className="pt-4">
          <Container size="xl">
            <Alert icon={<IconAlertCircle size={16} />} title="Giriş Gerekli" color="blue">
              Trade sinyallerini görmek için lütfen giriş yapın.
            </Alert>
          </Container>
          <Footer />
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
            <div>
              <Title order={1}>Swing Trade Sinyalleri</Title>
              <Text c="dimmed" size="sm" mt="xs">
                Signal.md kurallarına göre hesaplanmış profesyonel trade sinyalleri (4H zaman dilimi)
              </Text>
            </div>

            {loading ? (
              <Paper p="xl" withBorder>
                <Stack align="center">
                  <Loader size="lg" />
                  <Text c="dimmed">Sinyaller hesaplanıyor...</Text>
                </Stack>
              </Paper>
            ) : signals.length === 0 ? (
              <Alert icon={<IconAlertCircle size={16} />} title="Sinyal Bulunamadı" color="gray">
                Şu anda ≥55 skor alan ve trend filtresini geçen coin bulunmamaktadır. Piyasa koşulları uygun olmayabilir.
              </Alert>
            ) : (
              <Grid>
                {signals.map((signal) => (
                  <Grid.Col key={signal.coin.id} span={{ base: 12, md: 6, lg: 4 }}>
                    <SignalCard signal={signal} />
                  </Grid.Col>
                ))}
              </Grid>
            )}
          </Stack>
        </Container>
        <Footer />
      </AppShellMain>
    </AppShell>
  );
}

// Signal Card Component
function SignalCard({ signal }: { signal: SignalResult }) {
  const decisionColor =
    signal.decision === "LONG" ? "green" :
    signal.decision === "SHORT" ? "red" : "gray";
  
  const scoreColor =
    signal.score >= 80 ? "green" : signal.score >= 55 ? "yellow" : "gray";
  
  const scoreLabel =
    signal.score >= 80 ? "İŞLEM" : signal.score >= 55 ? "İZLEME LİSTESİ" : "KAÇIN";

  return (
    <Paper p="md" withBorder shadow="sm">
      <Stack gap="sm">
        {/* Header */}
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs">
            <Avatar src={signal.coin.image} size="sm" radius="xl" />
            <div>
              <Text fw={600} size="sm">
                {signal.coin.symbol.toUpperCase()}
              </Text>
              <Text size="xs" c="dimmed">
                {signal.coin.name}
              </Text>
            </div>
          </Group>
          <Badge color={decisionColor} size="lg">
            {signal.decision === "LONG" && <IconTrendingUp size={14} />}
            {signal.decision === "SHORT" && <IconTrendingDown size={14} />}
            {signal.decision}
          </Badge>
        </Group>

        {/* Price */}
        <div>
          <Text size="xl" fw={700}>
            ${signal.coin.current_price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 8,
            })}
          </Text>
          <Text
            size="sm"
            c={signal.coin.price_change_percentage_24h >= 0 ? "green" : "red"}
          >
            {signal.coin.price_change_percentage_24h >= 0 ? "+" : ""}
            {signal.coin.price_change_percentage_24h.toFixed(2)}%
          </Text>
        </div>

        {/* Score */}
        <Box>
          <Group justify="space-between" mb={5}>
            <Text size="sm" fw={500}>
              Güven Skoru
            </Text>
            <Badge color={scoreColor} variant="light">
              {scoreLabel}
            </Badge>
          </Group>
          <Progress value={signal.score} color={scoreColor} size="lg" />
          <Text size="xs" ta="right" mt={2} fw={600}>
            {signal.score}/100
          </Text>
        </Box>

        <Divider />

        {/* Score Breakdown */}
        <Stack gap={8}>
          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              Trend (ADX: {signal.trend.adx.toFixed(1)})
            </Text>
            <Text size="xs" fw={600}>
              {signal.trend.points}/40
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              Momentum (RSI: {signal.momentum.rsi.toFixed(1)})
            </Text>
            <Text size="xs" fw={600}>
              {signal.momentum.points}/25
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              Yapı (Fib: {signal.structure.fibCheck === "INVALID" 
                ? "GEÇERSİZ" 
                : signal.structure.fibCheck === "VALID_SAFE"
                ? "GEÇERLİ GÜVENLİ"
                : "GEÇERLİ KIRILGAN"})
            </Text>
            <Text size="xs" fw={600}>
              {signal.structure.points}/20
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              Risk (ATR: {signal.risk.atrPercent.toFixed(2)}%)
            </Text>
            <Text size="xs" fw={600}>
              {signal.risk.points}/15
            </Text>
          </Group>
        </Stack>

        <Divider />

        {/* Details */}
        <Stack gap={5}>
          <Text size="xs" fw={500}>
            Trend: {signal.trend.context === "BULLISH" ? "YÜKSELİŞ" : signal.trend.context === "BEARISH" ? "DÜŞÜŞ" : "NÖTR"} / {signal.trend.maStructure === "PERFECT" ? "MÜKEMMEL" : signal.trend.maStructure === "PARTIAL" ? "KISMİ" : "KARIŞIK"}
          </Text>
          <Text size="xs" fw={500}>
            Momentum: {signal.momentum.status}
          </Text>
          <Text size="xs" fw={500}>
            Yapı: {signal.structure.fibCheck === "INVALID" 
              ? `Fiyat ${signal.trend.context === "BULLISH" ? "61.8% seviyesinin altında" : "61.8% seviyesinin üstünde"} (${signal.structure.fibValue.toFixed(2)})`
              : `${signal.structure.distanceInATR.toFixed(2)} ATR mesafede seviyeden`}
          </Text>
          <Text size="xs" fw={500}>
            Risk: {signal.risk.assessment === "SAFE" ? "GÜVENLİ" : signal.risk.assessment === "ELEVATED" ? "YÜKSELMİŞ" : "AŞIRI"} ({signal.risk.stopLossRisk.toFixed(2)}% SL)
          </Text>
        </Stack>

        <Divider />

        {/* Justification */}
        <Text size="xs" c="dimmed" style={{ lineHeight: 1.4 }}>
          {signal.justification}
        </Text>
      </Stack>
    </Paper>
  );
}
