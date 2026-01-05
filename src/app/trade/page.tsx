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
  Modal,
  Skeleton,
} from "@mantine/core";
import { IconAlertCircle, IconTrendingUp, IconTrendingDown, IconSettings, IconRestore, IconBrain } from "@tabler/icons-react";
import { SignalResult, calculateSignal } from "@/lib/signal-engine";
import { SignalConfig, DEFAULT_SIGNAL_CONFIG } from "@/lib/signal-config";
import { createMultiTickerWebSocket, symbolToBinancePair, updateCoinFromTicker } from "@/lib/binance";
import { getCoinsWithSwingIndicators, SwingIndicators } from "@/lib/supabase/indicators";
import { Button, Drawer, Slider, Switch, Accordion, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { AnalysisRequest } from "@/lib/gemini";

export default function TradePage() {
  const { user } = useAuth();
  const [signals, setSignals] = useState<SignalResult[]>([]);
  const [indicatorsMap, setIndicatorsMap] = useState<Map<string, SwingIndicators>>(new Map());
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<SignalConfig>(DEFAULT_SIGNAL_CONFIG);
  const [opened, { open, close }] = useDisclosure(false);
  const wsRef = useRef<WebSocket | null>(null);
  const signalsRef = useRef<SignalResult[]>([]);

  const loadSignals = useCallback(async (currentConfig: SignalConfig) => {
    setLoading(true);
    try {
      // Veritabanından en son hesaplanmış verileri ve coinleri al
      const coinsWithIndicators = await getCoinsWithSwingIndicators();
      
      // Indicators map'ini oluştur (analiz için gerekli)
      const newIndicatorsMap = new Map<string, SwingIndicators>();
      coinsWithIndicators.forEach(({ coin, indicators }) => {
        newIndicatorsMap.set(coin.id, indicators);
      });
      setIndicatorsMap(newIndicatorsMap);
      
      const calculatedSignals = coinsWithIndicators.map(({ coin, indicators }) =>
        calculateSignal(indicators, coin, currentConfig)
      );
      
      // Filter: only show signals with score ≥ watchlist threshold
      const validSignals = calculatedSignals.filter((s) => s.showInUI);

      // Sort by score (highest first)
      validSignals.sort((a, b) => b.score - a.score);
      
      setSignals(validSignals);
      signalsRef.current = validSignals;
      
      // Setup WebSocket for price updates
      if (validSignals.length > 0) {
        const symbols = validSignals.map((s) => symbolToBinancePair(s.coin.symbol));
        
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
                  // Fiyat değiştikçe sinyali de config'e göre tekrar hesapla
                  // Ancak indicators verisini saklamak gerekiyor. Şimdilik sadece fiyat güncelle.
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
      loadSignals(config);
    } else {
      setSignals([]);
      setLoading(false);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user?.id, loadSignals, config]);

  const resetConfig = () => {
    setConfig(DEFAULT_SIGNAL_CONFIG);
  };


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
              <Group justify="space-between" align="flex-start">
                <div>
                  <Title order={1}>Swing Trade Sinyalleri</Title>
                  <Text c="dimmed" size="sm" mt="xs">
                    Signal.md kurallarına göre hesaplanmış profesyonel trade sinyalleri (4H zaman dilimi)
                  </Text>
                </div>
                <Group>
                  <Tooltip label="Sinyal Ayarları">
                    <Button 
                      leftSection={<IconSettings size={18} />} 
                      variant="light" 
                      onClick={open}
                    >
                      Ayarlar
                    </Button>
                  </Tooltip>
                </Group>
              </Group>

              {/* Sinyal Ayarları Drawer */}
              <Drawer
                opened={opened}
                onClose={close}
                title="Sinyal Filtreleme ve Esnetme"
                position="right"
                size="md"
              >
                <Stack gap="md">
                  <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
                    Bu ayarlar sinyal skorlarını anlık olarak etkiler. Kuralları gevşeterek daha fazla &quot;LONG/SHORT&quot; sinyali görebilirsiniz.
                  </Alert>

                  <Accordion defaultValue="thresholds">
                    <Accordion.Item value="thresholds">
                      <Accordion.Control>Karar Eşikleri</Accordion.Control>
                      <Accordion.Panel>
                        <Stack gap="sm">
                          <Text size="sm">İŞLEM Skoru (Min): {config.thresholds.action}</Text>
                          <Slider 
                            value={config.thresholds.action} 
                            onChange={(v) => setConfig({ ...config, thresholds: { ...config.thresholds, action: v } })}
                            min={50} max={90} step={1}
                          />
                          <Text size="sm" mt="md">İZLEME Skoru (Min): {config.thresholds.watchlist}</Text>
                          <Slider 
                            value={config.thresholds.watchlist} 
                            onChange={(v) => setConfig({ ...config, thresholds: { ...config.thresholds, watchlist: v } })}
                            min={30} max={70} step={1}
                          />
                        </Stack>
                      </Accordion.Panel>
                    </Accordion.Item>

                    <Accordion.Item value="trend">
                      <Accordion.Control>Trend Hassasiyeti</Accordion.Control>
                      <Accordion.Panel>
                        <Stack gap="sm">
                          <Text size="sm">Minimum ADX Gücü: {config.trend.adxMinimum}</Text>
                          <Slider 
                            value={config.trend.adxMinimum} 
                            onChange={(v) => setConfig({ ...config, trend: { ...config.trend, adxMinimum: v } })}
                            min={10} max={35}
                          />
                          <Switch 
                            label="Phase Lag Gevşetme (Reversal)" 
                            checked={config.trend.maPhaseLagGevşetme}
                            onChange={(e) => setConfig({ ...config, trend: { ...config.trend, maPhaseLagGevşetme: e.currentTarget.checked } })}
                            mt="sm"
                          />
                        </Stack>
                      </Accordion.Panel>
                    </Accordion.Item>

                    <Accordion.Item value="structure">
                      <Accordion.Control>Yapı (Fibonacci) Ayarları</Accordion.Control>
                      <Accordion.Panel>
                        <Stack gap="sm">
                          <Switch 
                            label="Hedefe Yaklaştıkça Puanı Düşür" 
                            checked={config.structure.kademeliAzalma}
                            onChange={(e) => setConfig({ ...config, structure: { ...config.structure, kademeliAzalma: e.currentTarget.checked } })}
                          />
                          <Text size="sm" mt="sm">Yanlış Taraf Toleransı (ATR): {config.structure.fibToleranceATR}</Text>
                          <Slider 
                            value={config.structure.fibToleranceATR} 
                            onChange={(v) => setConfig({ ...config, structure: { ...config.structure, fibToleranceATR: v } })}
                            min={1} max={10}
                          />
                        </Stack>
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>

                  <Divider />
                  <Button 
                    leftSection={<IconRestore size={18} />} 
                    variant="outline" 
                    color="gray" 
                    fullWidth
                    onClick={resetConfig}
                  >
                    Varsayılanlara Dön
                  </Button>
                </Stack>
              </Drawer>

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
                    <SignalCard 
                      signal={signal} 
                      indicators={indicatorsMap.get(signal.coin.id)} 
                    />
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
function SignalCard({ signal, indicators }: { signal: SignalResult; indicators?: SwingIndicators }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisModalOpened, { open: openAnalysisModal, close: closeAnalysisModal }] = useDisclosure(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  
  const loadingTexts = [
    "Yapay zeka analiz yapıyor...",
    "Teknik göstergeler analiz ediliyor...",
    "Piyasa verileri değerlendiriliyor...",
    "Sonuçlar hazırlanıyor...",
  ];

  useEffect(() => {
    if (analyzing) {
      const interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingTexts.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [analyzing, loadingTexts.length]);

  const handleAnalyze = async () => {
    if (!indicators) {
      setAnalysisError("Gösterge verileri bulunamadı.");
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    openAnalysisModal();

    try {
      const requestBody: AnalysisRequest = {
        coinName: signal.coin.name,
        symbol: signal.coin.symbol,
        price: signal.coin.current_price,
        tradingStrategy: "swing",
      };

      // Swing trade göstergeleri
      if (indicators.ma !== undefined && indicators.ma !== null) {
        requestBody.ma = indicators.ma;
      }
      if (indicators.atr !== undefined && indicators.atr !== null) {
        requestBody.atr = indicators.atr;
      }
      if (indicators.fib_value !== undefined && indicators.fib_value !== null) {
        requestBody.fib = {
          value: indicators.fib_value,
          trend: signal.trend.context === "BULLISH" ? "Yükseliş" : signal.trend.context === "BEARISH" ? "Düşüş" : "Nötr",
          startPrice: indicators.fib_start_price || 0,
          endPrice: indicators.fib_end_price || 0,
        };
      }
      if (indicators.rsi !== undefined && indicators.rsi !== null) {
        requestBody.rsi = indicators.rsi;
      }
      if (indicators.adx !== undefined && indicators.adx !== null) {
        requestBody.adx = indicators.adx;
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Analiz oluşturulurken bir hata oluştu");
      }

      const data = await response.json();
      setAnalysisResult(data.analysis);
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysisError(error instanceof Error ? error.message : "Analiz oluşturulurken bir hata oluştu");
    } finally {
      setAnalyzing(false);
    }
  };

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
            Risk: {signal.risk.assessment === "SAFE" 
              ? (signal.risk.atrPercent < 1.0 ? "ÇOK GÜVENLİ" : "GÜVENLİ")
              : signal.risk.assessment === "ELEVATED" 
              ? (signal.risk.atrPercent >= 2.0 ? "YÜKSELMİŞ" : "ORTA")
              : "AŞIRI"} ({signal.risk.stopLossRisk.toFixed(2)}% SL)
          </Text>
        </Stack>

        <Divider />

        {/* İşlem Seviyeleri (sadece LONG veya SHORT için) */}
        {signal.decision !== "WAIT" && signal.tradeLevels && (
          <>
            <Box>
              <Text size="sm" fw={600} mb="sm">
                İşlem Seviyeleri
              </Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Giriş (Al):
                  </Text>
                  <Text size="xs" fw={600} c={decisionColor}>
                    ${signal.tradeLevels.entryPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 8,
                    })}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Kâr Al (Sat):
                  </Text>
                  <Text size="xs" fw={600} c="green">
                    ${signal.tradeLevels.takeProfit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 8,
                    })}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Zarar Durdur (Stop):
                  </Text>
                  <Text size="xs" fw={600} c="red">
                    ${signal.tradeLevels.stopLoss.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 8,
                    })}
                  </Text>
                </Group>
              </Stack>
            </Box>
            <Divider />
          </>
        )}

        {/* Justification */}
        <Text size="xs" c="dimmed" style={{ lineHeight: 1.4 }}>
          {signal.justification}
        </Text>

        {/* Analiz Yap Butonu */}
        <Button
          variant="light"
          size="sm"
          fullWidth
          leftSection={<IconBrain size={16} />}
          onClick={handleAnalyze}
          disabled={analyzing || !indicators}
          mt="sm"
        >
          {analyzing ? "Analiz Yapılıyor..." : "AI Analiz Yap"}
        </Button>
      </Stack>

      {/* Analiz Sonuçları Modal */}
      <Modal
        opened={analysisModalOpened}
        onClose={closeAnalysisModal}
        title={`${signal.coin.symbol.toUpperCase()} - AI Analiz Sonuçları`}
        size="lg"
      >
        {analyzing ? (
          <Stack gap="md">
            <Group gap="sm" align="center">
              <Loader size="sm" />
              <Text fw={500} size="sm" c="dimmed">
                {loadingTexts[loadingTextIndex]}
              </Text>
            </Group>
            <Paper p="md" withBorder radius="md" style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
              <Stack gap="sm">
                <Skeleton height={14} radius="sm" />
                <Skeleton height={14} radius="sm" width="92%" />
                <Skeleton height={14} radius="sm" width="88%" />
                <Skeleton height={14} radius="sm" width="95%" />
                <Skeleton height={14} radius="sm" width="85%" />
                <Skeleton height={14} radius="sm" width="90%" />
              </Stack>
            </Paper>
          </Stack>
        ) : analysisError ? (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Hata"
            color="red"
            variant="light"
          >
            {analysisError}
          </Alert>
        ) : analysisResult ? (
          <Paper p="md" withBorder radius="md" style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
            <Text size="sm" style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {analysisResult}
            </Text>
          </Paper>
        ) : null}
      </Modal>
    </Paper>
  );
}
