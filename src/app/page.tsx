"use client";

import { HeaderMenu } from "@/components/header-menu";
import { Footer } from "@/components/footer";
import { AppShell, AppShellMain, Container, Title, Stack, Group } from "@mantine/core";
import { SearchBar } from "@/components/search-bar";
import { FilterPanel } from "@/components/filter-panel";
import { CryptoTable } from "@/components/crypto-table";
import { mockCryptoData } from "@/lib/mock-data";
import { SortField, SortOrder, FilterOptions } from "@/lib/types";
import { useState, useMemo } from "react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("market_cap_rank");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filters, setFilters] = useState<FilterOptions>({});

  const filteredAndSortedCoins = useMemo(() => {
    let result = [...mockCryptoData];

    // Arama filtresi
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (coin) =>
          coin.name.toLowerCase().includes(query) ||
          coin.symbol.toLowerCase().includes(query)
      );
    }

    // Fiyat filtresi
    if (filters.minPrice !== undefined) {
      result = result.filter((coin) => coin.current_price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter((coin) => coin.current_price <= filters.maxPrice!);
    }

    // Market cap filtresi
    if (filters.minMarketCap !== undefined) {
      result = result.filter((coin) => coin.market_cap >= filters.minMarketCap!);
    }
    if (filters.maxMarketCap !== undefined) {
      result = result.filter((coin) => coin.market_cap <= filters.maxMarketCap!);
    }

    // Sıralama
    result.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortField) {
        case "current_price":
          aValue = a.current_price;
          bValue = b.current_price;
          break;
        case "price_change_percentage_24h":
          aValue = a.price_change_percentage_24h;
          bValue = b.price_change_percentage_24h;
          break;
        case "market_cap":
          aValue = a.market_cap;
          bValue = b.market_cap;
          break;
        case "market_cap_rank":
        default:
          aValue = a.market_cap_rank;
          bValue = b.market_cap_rank;
          break;
      }

      if (sortOrder === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return result;
  }, [searchQuery, filters, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleResetFilters = () => {
    setFilters({});
    setSearchQuery("");
  };

  return (
    <AppShell header={{ height: 110 }} padding={0}>
      <HeaderMenu />
      <AppShellMain className="pt-4">
        <Container size="xl">
          <Stack gap="md">
            <Title order={1}>Kripto Para Piyasaları</Title>

            <Stack gap="md">
              <Group justify="space-between" align="flex-end" wrap="wrap">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Coin ara..."
                  label="Ara"
                />
                <FilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  onReset={handleResetFilters}
                />
              </Group>

              <CryptoTable
                coins={filteredAndSortedCoins}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
            </Stack>
          </Stack>
        </Container>
        <Footer />
      </AppShellMain>
    </AppShell>
  );
}
