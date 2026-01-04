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
  Accordion,
  Badge,
  Group,
  Divider,
  Grid,
} from "@mantine/core";
import { IconBook } from "@tabler/icons-react";

interface Indicator {
  name: string;
  category: string;
  description: string;
  strategy: string;
  strengths: string;
  weaknesses: string;
  combination: string;
  scalpingScore: number;
  swingScore: number;
}

const indicators: Indicator[] = [
  {
    name: "RSI (Relative Strength Index)",
    category: "Momentum Osilatörü",
    description:
      "J. Welles Wilder tarafından geliştirilen RSI, bir finansal varlığın fiyat hareketlerinin hızını ve değişim oranını ölçer. 0–100 arasında değer alır; genellikle 70 üzeri aşırı alım, 30 altı aşırı satım sinyali olarak değerlendirilir. Yükselen RSI, güçlü alım momentumuna işaret edebilir; RSI ile fiyat arasında uyumsuzluk (divergence) görülmesi dönüş sinyali olarak yorumlanabilir.",
    strategy:
      "4H grafikte RSI, orta vadeli momentum tespitinde etkilidir. Güçlü trendlerde aşırı alım/satım bölgelerini göstererek swing işlemler için yararlıdır. 4H'de RSI varsayılan ayarlarıyla nispeten ağırdan çalıştığı için scalping (çok kısa vadeli işlemler) için sınırlıdır.",
    strengths:
      "Basit ve yaygın kullanılır; trend dönüşlerinin erken işaretlerini verebilir. Aşırı alım/satım düzeylerine kolayca ulaşır.",
    weaknesses:
      "Güçlü trendlerde RSI uzun süre aşırı alım veya aşırı satımda kalabilir, yanıltıcı sinyaller üretebilir. Yalnız kullanıldığında false signal (yanlış sinyal) riski vardır.",
    combination:
      "Destek/direnç seviyeleri veya hareketli ortalamalar (MA) ile birlikte; MACD, ADX gibi momentum göstergeleri ile uyumlu çalışır.",
    scalpingScore: 4,
    swingScore: 7,
  },
  {
    name: "MACD (Moving Average Convergence Divergence)",
    category: "Momentum Göstergesi",
    description:
      "1970'lerde Gerald Appel tarafından geliştirilen MACD, 12 periyotlu EMA ile 26 periyotlu EMA farkını gösteren bir osilatördür; ayrıca bu farkın 9 periyotluk hareketli ortalaması (sinyal hattı) ile kullanılır. MACD sıfır çizgisi etrafında salınır. Sinyal hattının üzerindeki kesişmeler alım; aşağı kesişmeler ise satım sinyali olarak yorumlanır.",
    strategy:
      "MACD, 4H grafiklerde orta vadeli trend değişimlerini gösterir. 4H'de sinyalleri nispeten yavaştır; bu nedenle scalping için ideal değildir. Ancak swing işlemlerde, trend değişimlerini ve momentum kaybını teyit etmek için güçlüdür.",
    strengths: "Çok yaygın kullanılır ve grafik üzerinde net kesişimler verir. Hareketli ortalamalar kullanarak hızı ve yönü özetler.",
    weaknesses:
      "Göstergesi gecikmelidir (lagging); hızlı fiyat hareketlerinde sinyali kaçırabilir. Piyasa yatay seyrederken çok fazla yanlış sinyal üretebilir.",
    combination:
      "Fiyat hareketi veya trend göstergeleri ile birlikte. RSI ile uyumlu çalışabilir; birinde uyumsuzluk varsa dikkat çeker.",
    scalpingScore: 3,
    swingScore: 6,
  },
  {
    name: "Stochastic Osilatörü",
    category: "Momentum Osilatörü",
    description:
      "George Lane tarafından geliştirilen Stochastic, kapanış fiyatını belirli bir periyottaki fiyat aralığı ile karşılaştırır bir momentum göstergesidir. 0–100 arasında salınır; genellikle %K (ana çizgi) ve %D (hızlandırılmış 3 periyot MA) olmak üzere iki çizgi içerir.",
    strategy:
      "4H grafikte Stochastic, aşırı alım/satım bölgelerini tespit etmede etkilidir. Swing işlemler için uygundur ancak scalping için sınırlıdır.",
    strengths: "Aşırı alım/satım seviyelerini net gösterir.",
    weaknesses: "Güçlü trendlerde yanıltıcı sinyaller verebilir.",
    combination: "RSI ve MACD ile birlikte kullanılabilir.",
    scalpingScore: 4,
    swingScore: 6,
  },
  {
    name: "ADX (Average Directional Index)",
    category: "Trend Gücü Göstergesi",
    description:
      "ADX, trendin gücünü ölçer ancak trendin yönünü göstermez. 0-100 arasında değer alır; 25 üzeri güçlü trend, 20 altı zayıf trend olarak yorumlanır.",
    strategy:
      "4H grafikte trend gücünü belirlemek için kullanılır. Swing işlemler için çok etkilidir, scalping için sınırlıdır.",
    strengths: "Trend gücünü objektif olarak ölçer.",
    weaknesses: "Trend yönünü göstermez, sadece gücü gösterir.",
    combination: "Hareketli ortalamalar ve RSI ile birlikte kullanılır.",
    scalpingScore: 3,
    swingScore: 7,
  },
  {
    name: "Bollinger Bands",
    category: "Volatilite Göstergesi",
    description:
      "John Bollinger tarafından geliştirilen Bollinger Bands, fiyatın üst, orta ve alt bantlarını gösterir. Üst ve alt bantlar, orta banttan (genellikle 20 periyotlu MA) standart sapma ile hesaplanır.",
    strategy:
      "4H grafikte volatilite ve potansiyel dönüş noktalarını gösterir. Swing işlemler için etkilidir.",
    strengths: "Volatiliteyi ve aşırı alım/satım bölgelerini gösterir.",
    weaknesses: "Güçlü trendlerde bantların dışında kalabilir.",
    combination: "RSI ve hacim göstergeleri ile birlikte kullanılır.",
    scalpingScore: 5,
    swingScore: 7,
  },
  {
    name: "ATR (Average True Range)",
    category: "Volatilite Göstergesi",
    description:
      "ATR, volatiliteyi ölçer ve stop-loss seviyelerini belirlemek için kullanılır. Fiyat hareketinin ortalama aralığını gösterir.",
    strategy:
      "Risk yönetimi için kritiktir. Stop-loss ve pozisyon büyüklüğü ayarlamasında kullanılır.",
    strengths: "Volatiliteyi objektif olarak ölçer, risk yönetimi için idealdir.",
    weaknesses: "Sinyal üretmez, sadece volatiliteyi gösterir.",
    combination: "Diğer tüm göstergelerle birlikte risk yönetimi için kullanılır.",
    scalpingScore: 6,
    swingScore: 8,
  },
  {
    name: "Fibonacci Retracement",
    category: "Destek/Direnç Göstergesi",
    description:
      "Fibonacci seviyeleri, fiyat düzeltmelerinin olası destek ve direnç noktalarını gösterir. %23.6, %38.2, %50, %61.8 ve %78.6 seviyeleri kullanılır.",
    strategy:
      "4H grafikte önemli destek ve direnç seviyelerini belirlemek için kullanılır. Swing işlemler için çok etkilidir.",
    strengths: "Psikolojik destek/direnç seviyelerini gösterir.",
    weaknesses: "Her zaman çalışmayabilir, diğer göstergelerle teyit edilmelidir.",
    combination: "RSI, MACD ve candlestick formasyonları ile birlikte kullanılır.",
    scalpingScore: 4,
    swingScore: 8,
  },
  {
    name: "Ichimoku Cloud",
    category: "Trend Göstergesi",
    description:
      "Ichimoku, trend yönü, momentum ve destek/direnç seviyelerini bir arada gösteren kapsamlı bir göstergedir. Beş çizgiden oluşur: Tenkan-sen, Kijun-sen, Senkou Span A, Senkou Span B ve Chikou Span.",
    strategy:
      "4H grafikte trend analizi için çok güçlüdür. Swing işlemler için idealdir.",
    strengths: "Kapsamlı analiz sağlar, trend yönü ve gücünü gösterir.",
    weaknesses: "Karmaşık görünebilir, öğrenme eğrisi vardır.",
    combination: "RSI ve hacim göstergeleri ile birlikte kullanılabilir.",
    scalpingScore: 3,
    swingScore: 7,
  },
  {
    name: "CCI (Commodity Channel Index)",
    category: "Momentum Osilatörü",
    description:
      "CCI, fiyatın normal aralığından sapmasını ölçer. +100 üzeri aşırı alım, -100 altı aşırı satım sinyali olarak yorumlanır. Trend gücünü ve potansiyel dönüş noktalarını gösterir.",
    strategy:
      "4H grafikte momentum ve aşırı alım/satım bölgelerini tespit etmede etkilidir. Swing işlemler için uygundur.",
    strengths: "Aşırı alım/satım seviyelerini net gösterir, trend gücünü ölçer.",
    weaknesses: "Güçlü trendlerde yanıltıcı sinyaller verebilir.",
    combination: "RSI ve Stochastic ile birlikte kullanılabilir.",
    scalpingScore: 4,
    swingScore: 6,
  },
  {
    name: "Williams %R",
    category: "Momentum Osilatörü",
    description:
      "Williams %R, aşırı alım ve aşırı satım seviyelerini gösteren bir momentum osilatörüdür. -20 üzeri aşırı alım, -80 altı aşırı satım olarak yorumlanır.",
    strategy:
      "4H grafikte aşırı alım/satım bölgelerini tespit etmede etkilidir. Swing işlemler için uygundur.",
    strengths: "Aşırı alım/satım seviyelerini net gösterir.",
    weaknesses: "Güçlü trendlerde yanıltıcı sinyaller verebilir.",
    combination: "RSI ve Stochastic ile birlikte kullanılabilir.",
    scalpingScore: 4,
    swingScore: 5,
  },
  {
    name: "OBV (On-Balance Volume)",
    category: "Hacim Göstergesi",
    description:
      "OBV, hacim ve fiyat hareketini birleştirerek trend onayı sağlar. OBV yükseliyorsa alıcılar hakimdir, düşüyorsa satıcılar hakimdir. Fiyat ile OBV arasındaki uyumsuzluk (divergence) önemli sinyaldir.",
    strategy:
      "4H grafikte trend onayı için kullanılır. Swing işlemler için etkilidir.",
    strengths: "Hacim ve fiyat ilişkisini gösterir, trend onayı sağlar.",
    weaknesses: "Tek başına sinyal üretmez, diğer göstergelerle birlikte kullanılmalıdır.",
    combination: "RSI, MACD ve fiyat hareketi ile birlikte kullanılır.",
    scalpingScore: 3,
    swingScore: 6,
  },
  {
    name: "MFI (Money Flow Index)",
    category: "Hacim Göstergesi",
    description:
      "MFI, RSI'ın hacim ağırlıklı versiyonudur. 0-100 arasında değer alır; 80 üzeri aşırı alım, 20 altı aşırı satım sinyali olarak yorumlanır. Hacim ve fiyat momentumunu birleştirir.",
    strategy:
      "4H grafikte hacim onaylı momentum analizi için kullanılır. Swing işlemler için etkilidir.",
    strengths: "Hacim ve momentumu birleştirir, RSI'dan daha güvenilir sinyaller verebilir.",
    weaknesses: "RSI gibi güçlü trendlerde yanıltıcı olabilir.",
    combination: "RSI ve OBV ile birlikte kullanılır.",
    scalpingScore: 4,
    swingScore: 7,
  },
  {
    name: "VWAP (Volume-Weighted Average Price)",
    category: "Hacim Göstergesi",
    description:
      "VWAP, işlem hacmine göre ağırlıklandırılmış ortalama fiyattır. Günlük işlemlerde önemli bir referans noktasıdır. VWAP üzerindeki fiyatlar yükseliş, altındaki fiyatlar düşüş sinyali olarak yorumlanır.",
    strategy:
      "4 saatlikte anlamlı değildir, özellikle swing için sınırlıdır. Scalpingte sadece günlük intraday için kullanılır.",
    strengths: "Günlük işlemlerde güçlü referans noktası sağlar.",
    weaknesses: "4 saatlik grafikte anlamlı değildir, günlük veri gerektirir.",
    combination: "Günlük grafiklerde pivot noktaları ve destek/direnç ile birlikte kullanılır.",
    scalpingScore: 6,
    swingScore: 2,
  },
  {
    name: "Pivot Points",
    category: "Destek/Direnç Göstergesi",
    description:
      "Pivot noktaları, önceki günün yüksek, düşük ve kapanış fiyatlarından hesaplanan destek ve direnç seviyeleridir. R1, R2, R3 (direnç) ve S1, S2, S3 (destek) seviyeleri gösterir.",
    strategy:
      "4H grafikte önemli destek ve direnç seviyelerini belirlemek için kullanılır. Kısa vadeli işlemler için etkilidir.",
    strengths: "Psikolojik destek/direnç seviyelerini gösterir, hedef ve stop-loss belirlemede kullanılır.",
    weaknesses: "Güçlü trendlerde çalışmayabilir, diğer göstergelerle teyit edilmelidir.",
    combination: "Fibonacci, RSI ve candlestick formasyonları ile birlikte kullanılır.",
    scalpingScore: 5,
    swingScore: 6,
  },
  {
    name: "Parabolic SAR",
    category: "Trend Göstergesi",
    description:
      "Parabolic SAR, trend yönünü ve potansiyel dönüş noktalarını gösterir. Fiyatın altındaki SAR yükseliş, üstündeki SAR düşüş sinyali verir. Stop-loss seviyesi belirlemede de kullanılır.",
    strategy:
      "4H grafikte trend takibi için kullanılır. Swing işlemler için uygundur.",
    strengths: "Trend yönünü net gösterir, stop-loss seviyesi belirlemede kullanılır.",
    weaknesses: "Yatay piyasalarda çok fazla yanlış sinyal üretebilir.",
    combination: "ADX ve hareketli ortalamalar ile birlikte kullanılır.",
    scalpingScore: 3,
    swingScore: 6,
  },
  {
    name: "Moving Averages (MA)",
    category: "Trend Göstergesi",
    description:
      "Hareketli ortalamalar, belirli bir periyottaki ortalama fiyatı gösterir. SMA (Simple MA) ve EMA (Exponential MA) en yaygın kullanılanlardır. Kısa vadeli MA'nın uzun vadeli MA'yı yukarı kesmesi alım, aşağı kesmesi satım sinyali olarak yorumlanır.",
    strategy:
      "4H grafikte trend yönü belirlemede çok etkilidir. Swing işlemler için idealdir. Uzun vadeli MA'lar (50, 100, 200) trend yönü için, kısa vadeli MA'lar (9, 21) giriş/çıkış sinyalleri için kullanılır.",
    strengths: "Trend yönünü objektif olarak gösterir, yaygın kullanılır ve güvenilirdir.",
    weaknesses: "Gecikmelidir (lagging), hızlı fiyat hareketlerinde geç kalabilir.",
    combination: "RSI, MACD ve ADX ile birlikte kullanılır.",
    scalpingScore: 4,
    swingScore: 8,
  },
  {
    name: "Candlestick Patterns",
    category: "Pattern Göstergesi",
    description:
      "Candlestick (mum) formasyonları, fiyat hareketlerinin görsel temsilidir. Hammer, Doji, Engulfing, Shooting Star gibi formasyonlar trend dönüşü veya devamı sinyalleri verebilir. Tek başlarına yeterli değil, diğer göstergelerle teyit edilmelidir.",
    strategy:
      "4H grafikte trend dönüş sinyalleri için kullanılır. Swing işlemler için destekleyici rol oynar.",
    strengths: "Görsel olarak anlaşılır, trend dönüş sinyalleri verebilir.",
    weaknesses: "Tek başlarına yeterli değildir, yanlış sinyal riski yüksektir. Sadece destekleyici kullanılmalıdır.",
    combination: "RSI, MACD ve destek/direnç seviyeleri ile birlikte kullanılır.",
    scalpingScore: 2,
    swingScore: 4,
  },
];

const categories = [
  "Momentum ve Osilatör Göstergeleri",
  "Volatilite Göstergeleri",
  "Hacim Göstergeleri",
  "Destek/Direnç Göstergeleri",
  "Trend Göstergeleri",
  "Pattern Göstergeleri",
];

export default function DocsPage() {
  const getCategoryIndicators = (category: string) => {
    if (category === "Momentum ve Osilatör Göstergeleri") {
      return indicators.filter(
        (ind) =>
          ind.category === "Momentum Osilatörü" ||
          ind.category === "Momentum Göstergesi"
      );
    }
    if (category === "Volatilite Göstergeleri") {
      return indicators.filter((ind) => ind.category === "Volatilite Göstergesi");
    }
    if (category === "Hacim Göstergeleri") {
      return indicators.filter((ind) => ind.category === "Hacim Göstergesi");
    }
    if (category === "Destek/Direnç Göstergeleri") {
      return indicators.filter(
        (ind) => ind.category === "Destek/Direnç Göstergesi"
      );
    }
    if (category === "Trend Göstergeleri") {
      return indicators.filter((ind) => ind.category === "Trend Gücü Göstergesi" || ind.category === "Trend Göstergesi");
    }
    if (category === "Pattern Göstergeleri") {
      return indicators.filter((ind) => ind.category === "Pattern Göstergesi");
    }
    return [];
  };

  return (
    <AppShell header={{ height: 110 }} padding={0}>
      <HeaderMenu />
      <AppShellMain className="pt-4">
        <Container size="xl">
          <Stack gap="xl" py="xl">
            <Group gap="md">
              <IconBook size={32} />
              <Title order={1}>Teknik Göstergeler ve Kategorileri</Title>
            </Group>

            <Text c="dimmed" size="lg">
              Kripto piyasasında kullanılan teknik göstergelerin detaylı açıklamaları,
              kullanım alanları ve stratejilere uygunlukları.
            </Text>

            <Divider />

            {categories.map((category) => (
              <Paper key={category} p="md" withBorder radius="md">
                <Stack gap="md">
                  <Title order={2} size="h3">
                    {category}
                  </Title>
                  <Accordion variant="separated" radius="md">
                    {getCategoryIndicators(category).map((indicator) => (
                      <Accordion.Item key={indicator.name} value={indicator.name}>
                        <Accordion.Control>
                          <Group justify="space-between" pr="md">
                            <Text fw={500}>{indicator.name}</Text>
                            <Group gap="xs">
                              <Badge color="blue" variant="light">
                                Scalping: {indicator.scalpingScore}/10
                              </Badge>
                              <Badge color="green" variant="light">
                                Swing: {indicator.swingScore}/10
                              </Badge>
                            </Group>
                          </Group>
                        </Accordion.Control>
                        <Accordion.Panel>
                          <Stack gap="md">
                            <div>
                              <Text fw={600} size="sm" c="dimmed" mb={4}>
                                Kategori
                              </Text>
                              <Badge variant="light">{indicator.category}</Badge>
                            </div>

                            <div>
                              <Text fw={600} size="sm" c="dimmed" mb={4}>
                                Tanım / Kullanım
                              </Text>
                              <Text size="sm">{indicator.description}</Text>
                            </div>

                            <div>
                              <Text fw={600} size="sm" c="dimmed" mb={4}>
                                Stratejiye Uygunluk
                              </Text>
                              <Text size="sm">{indicator.strategy}</Text>
                            </div>

                            <Grid>
                              <Grid.Col span={{ base: 12, md: 6 }}>
                                <div>
                                  <Text fw={600} size="sm" c="dimmed" mb={4}>
                                    Güçlü Yönler
                                  </Text>
                                  <Text size="sm" c="green">
                                    {indicator.strengths}
                                  </Text>
                                </div>
                              </Grid.Col>
                              <Grid.Col span={{ base: 12, md: 6 }}>
                                <div>
                                  <Text fw={600} size="sm" c="dimmed" mb={4}>
                                    Zayıf Yönler
                                  </Text>
                                  <Text size="sm" c="red">
                                    {indicator.weaknesses}
                                  </Text>
                                </div>
                              </Grid.Col>
                            </Grid>

                            <div>
                              <Text fw={600} size="sm" c="dimmed" mb={4}>
                                Kombinasyon
                              </Text>
                              <Text size="sm">{indicator.combination}</Text>
                            </div>

                            <Group gap="md">
                              <div>
                                <Text fw={600} size="sm" c="dimmed" mb={4}>
                                  Scalping Etkinlik Puanı
                                </Text>
                                <Badge color="blue" size="lg" variant="light">
                                  {indicator.scalpingScore}/10
                                </Badge>
                              </div>
                              <div>
                                <Text fw={600} size="sm" c="dimmed" mb={4}>
                                  Swing Etkinlik Puanı
                                </Text>
                                <Badge color="green" size="lg" variant="light">
                                  {indicator.swingScore}/10
                                </Badge>
                              </div>
                            </Group>
                          </Stack>
                        </Accordion.Panel>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </Stack>
              </Paper>
            ))}

            <Paper p="md" withBorder radius="md" bg="blue.0" c="blue.9">
              <Stack gap="md">
                <Title order={3} size="h4">
                  Önemli Notlar
                </Title>
                
                <div>
                  <Title order={4} size="h5" mb="sm">
                    Swing Trading için Önerilen 5 Gösterge
                  </Title>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>
                      1. Moving Averages (MA) - 8/10
                    </Text>
                    <Text size="sm" c="dimmed" ml="md">
                      Trend yönü belirlemede temel araç. Uzun vadeli MA'lar (50, 100, 200) trend yönü için, kısa vadeli MA'lar (9, 21) giriş/çıkış sinyalleri için kullanılır.
                    </Text>
                    
                    <Text size="sm" fw={500}>
                      2. ATR (Average True Range) - 8/10
                    </Text>
                    <Text size="sm" c="dimmed" ml="md">
                      Risk yönetimi için kritik. Stop-loss ve pozisyon büyüklüğü ayarlamasında kullanılır. Volatiliteyi objektif olarak ölçer.
                    </Text>
                    
                    <Text size="sm" fw={500}>
                      3. Fibonacci Retracement - 8/10
                    </Text>
                    <Text size="sm" c="dimmed" ml="md">
                      Önemli destek ve direnç seviyelerini belirler. %61.8 seviyesi özellikle güçlü bir seviyedir. Hedef ve stop-loss belirlemede kullanılır.
                    </Text>
                    
                    <Text size="sm" fw={500}>
                      4. RSI (Relative Strength Index) - 7/10
                    </Text>
                    <Text size="sm" c="dimmed" ml="md">
                      Momentum tespitinde etkili. Aşırı alım (70+) ve aşırı satım (30-) bölgelerini gösterir. Trend dönüşlerinin erken işaretlerini verebilir.
                    </Text>
                    
                    <Text size="sm" fw={500}>
                      5. ADX (Average Directional Index) - 7/10
                    </Text>
                    <Text size="sm" c="dimmed" ml="md">
                      Trend gücünü objektif olarak ölçer. 25 üzeri güçlü trend, 20 altı zayıf trend. Trend yönü için MA ile birlikte kullanılmalıdır.
                    </Text>
                  </Stack>
                </div>

                <Divider />

                <div>
                  <Title order={4} size="h5" mb="sm">
                    Scalping için Önerilen 5 Gösterge
                  </Title>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>
                      1. ATR (Average True Range) - 6/10
                    </Text>
                    <Text size="sm" c="dimmed" ml="md">
                      Risk yönetimi için kritik. Scalping'te sık stop-loss ayarlamaları gerektiğinden ATR volatilite ölçümü çok önemlidir.
                    </Text>
                    
                    <Text size="sm" fw={500}>
                      2. VWAP (Volume-Weighted Average Price) - 6/10
                    </Text>
                    <Text size="sm" c="dimmed" ml="md">
                      Günlük işlemlerde güçlü referans noktası. VWAP üzerindeki fiyatlar yükseliş, altındaki fiyatlar düşüş sinyali. Günlük intraday için kullanılır.
                    </Text>
                    
                    <Text size="sm" fw={500}>
                      3. Bollinger Bands - 5/10
                    </Text>
                    <Text size="sm" c="dimmed" ml="md">
                      Volatilite ve potansiyel dönüş noktalarını gösterir. Bantların daralması (squeeze) büyük hareket öncesi sinyal verebilir.
                    </Text>
                    
                    <Text size="sm" fw={500}>
                      4. Pivot Points - 5/10
                    </Text>
                    <Text size="sm" c="dimmed" ml="md">
                      Kısa vadeli destek ve direnç seviyelerini belirler. R1, R2, R3 (direnç) ve S1, S2, S3 (destek) seviyeleri hedef ve stop-loss için kullanılır.
                    </Text>
                    
                    <Text size="sm" fw={500}>
                      5. RSI (Relative Strength Index) - 4/10
                    </Text>
                    <Text size="sm" c="dimmed" ml="md">
                      Kısa vadeli momentum tespiti için kullanılır. 4H grafikte sınırlı olsa da, daha küçük zaman dilimlerinde (15dk-1s) etkilidir.
                    </Text>
                  </Stack>
                </div>

                <Divider />

                <Stack gap="xs">
                  <Text size="sm" fw={600}>
                    Genel Öneriler:
                  </Text>
                  <Text size="sm">
                    • Daha sağlam ticaret sinyalleri için, en az 2-3 gösterge birlikte kullanılmalıdır.
                  </Text>
                  <Text size="sm">
                    • Scalping için 4H chart yerine daha küçük zaman dilimleri (15dk-1s) kullanılmalıdır.
                  </Text>
                  <Text size="sm">
                    • Her gösterge için atanan etkinlik puanı, ilgili stratejideki fayda ve profesyonel kullanım sıklığına göre verilmiştir.
                  </Text>
                  <Text size="sm">
                    • Risk yönetimi her zaman öncelikli olmalıdır. ATR gibi risk yönetimi göstergeleri her stratejide kullanılmalıdır.
                  </Text>
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        </Container>
        <Footer />
      </AppShellMain>
    </AppShell>
  );
}
