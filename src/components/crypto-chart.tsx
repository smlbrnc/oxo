"use client";

import { useEffect, useRef, useCallback } from "react";
import { createChart, ColorType, CandlestickSeries, ISeriesApi, Time } from "lightweight-charts";
import { useMantineColorScheme } from "@mantine/core";

interface CryptoChartProps {
  symbol?: string;
  interval?: string;
}

export function CryptoChart({ symbol = "BTCUSDT", interval = "4h" }: CryptoChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const { colorScheme } = useMantineColorScheme();

  // Tema renkleri
  const isDark = colorScheme === "dark";
  const getChartColors = useCallback(() => ({
    background: isDark ? "#253248" : "#FFFFFF",
    text: isDark ? "#DDD" : "#333333",
    grid: isDark ? "#334158" : "#E0E0E0",
    upColor: "#26a69a",
    downColor: "#ef5350",
  }), [isDark]);

  // Chart oluşturma ve veri yükleme
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartColors = getChartColors();

    // Chart ayarları
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: chartColors.background },
        textColor: chartColors.text,
      },
      grid: {
        vertLines: { color: chartColors.grid },
        horzLines: { color: chartColors.grid },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });

    chartRef.current = chart;

    // Mum grafiği serisi ekle (v5 API)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: chartColors.upColor,
      downColor: chartColors.downColor,
      borderVisible: false,
      wickUpColor: chartColors.upColor,
      wickDownColor: chartColors.downColor,
    });

    seriesRef.current = candlestickSeries;

    // Binance API'den veri çekme fonksiyonu
    const fetchData = async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=200`
        );
        
        if (!response.ok) {
          throw new Error("Veri çekilemedi");
        }

        const data = await response.json();

        // Veri dönüşümü
        const cdata = data.map((d: number[]) => ({
          time: (d[0] / 1000) as Time, // Binance ms verir, kütüphane saniye ister
          open: parseFloat(d[1].toString()),
          high: parseFloat(d[2].toString()),
          low: parseFloat(d[3].toString()),
          close: parseFloat(d[4].toString()),
        }));

        candlestickSeries.setData(cdata);
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      }
    };

    fetchData();

    // Responsive ayarı
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      seriesRef.current = null;
    };
  }, [symbol, interval, getChartColors]);

  // Tema değiştiğinde renkleri güncelle
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;

    const chartColors = getChartColors();

    // Chart renklerini güncelle
    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: chartColors.background },
        textColor: chartColors.text,
      },
      grid: {
        vertLines: { color: chartColors.grid },
        horzLines: { color: chartColors.grid },
      },
    });

    // Seri renklerini güncelle
    seriesRef.current.applyOptions({
      upColor: chartColors.upColor,
      downColor: chartColors.downColor,
      wickUpColor: chartColors.upColor,
      wickDownColor: chartColors.downColor,
    });
  }, [isDark, getChartColors]);

  return (
    <div
      ref={chartContainerRef}
      style={{ position: "relative", width: "100%" }}
    />
  );
}
