"use client";

import {
  Table,
  Avatar,
  Badge,
  Text,
  ActionIcon,
  Group,
  Stack,
  Tooltip,
} from "@mantine/core";
import { IconStar, IconStarFilled } from "@tabler/icons-react";
import Link from "next/link";
import { CryptoCoin, SortField, SortOrder } from "@/lib/types";
import { formatCurrency, formatLargeNumber, formatPercentage, getFavorites, toggleFavorite } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";
import { symbolToBinancePair } from "@/lib/binance";

interface CryptoTableProps {
  coins: CryptoCoin[];
  sortField?: SortField;
  sortOrder?: SortOrder;
  onSort?: (field: SortField) => void;
}

export function CryptoTable({ coins, sortField, sortOrder, onSort }: CryptoTableProps) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loadingFavorites, setLoadingFavorites] = useState<Set<string>>(new Set());

  // Load favorites when user changes
  useEffect(() => {
    if (user?.id) {
      loadFavorites();
    } else {
      setFavorites(new Set());
    }
  }, [user?.id]);

  const loadFavorites = async () => {
    if (!user?.id) return;
    const favoriteIds = await getFavorites(user.id);
    setFavorites(new Set(favoriteIds));
  };

  const handleFavoriteClick = async (coinId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user?.id) return;

    setLoadingFavorites((prev) => new Set(prev).add(coinId));
    
    try {
      await toggleFavorite(user.id, coinId);
      setFavorites((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(coinId)) {
          newSet.delete(coinId);
        } else {
          newSet.add(coinId);
        }
        return newSet;
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setLoadingFavorites((prev) => {
        const newSet = new Set(prev);
        newSet.delete(coinId);
        return newSet;
      });
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? "↑" : "↓";
  };

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: 50 }}>#</Table.Th>
            <Table.Th>Coin</Table.Th>
            <Table.Th
              style={{ cursor: "pointer", userSelect: "none" }}
              onClick={() => onSort?.("current_price")}
            >
              Fiyat {getSortIcon("current_price")}
            </Table.Th>
            <Table.Th
              style={{ cursor: "pointer", userSelect: "none" }}
              onClick={() => onSort?.("price_change_percentage_24h")}
            >
              24s Değişim {getSortIcon("price_change_percentage_24h")}
            </Table.Th>
            <Table.Th
              style={{ cursor: "pointer", userSelect: "none" }}
              onClick={() => onSort?.("market_cap")}
            >
              Market Cap {getSortIcon("market_cap")}
            </Table.Th>
            <Table.Th
              style={{ cursor: "pointer", userSelect: "none" }}
              onClick={() => onSort?.("market_cap_rank")}
            >
              Sıra {getSortIcon("market_cap_rank")}
            </Table.Th>
            <Table.Th>İşlem</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {coins.map((coin) => {
            const isFav = favorites.has(coin.id);
            const isLoading = loadingFavorites.has(coin.id);
            const isPositive = coin.price_change_percentage_24h >= 0;

            return (
              <Table.Tr key={coin.id}>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {coin.market_cap_rank}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Link
                    href={`/market?symbol=${symbolToBinancePair(coin.symbol)}`}
                    className="no-underline text-inherit"
                  >
                    <Group gap="sm">
                      <Avatar src={coin.image} alt={coin.name} size="sm" />
                      <Stack gap={0}>
                        <Text fw={500} size="sm">
                          {coin.name}
                        </Text>
                        <Text size="xs" c="dimmed" tt="uppercase">
                          {coin.symbol}
                        </Text>
                      </Stack>
                    </Group>
                  </Link>
                </Table.Td>
                <Table.Td>
                  <Text fw={500}>{formatCurrency(coin.current_price)}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={isPositive ? "green" : "red"}
                    variant="light"
                  >
                    {formatPercentage(coin.price_change_percentage_24h)}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{formatLargeNumber(coin.market_cap)}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    #{coin.market_cap_rank}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {user?.id ? (
                    <Tooltip label={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}>
                      <ActionIcon
                        variant="subtle"
                        color={isFav ? "yellow" : "gray"}
                        onClick={(e) => handleFavoriteClick(coin.id, e)}
                        loading={isLoading}
                        disabled={isLoading}
                      >
                        {isFav ? (
                          <IconStarFilled size={18} />
                        ) : (
                          <IconStar size={18} />
                        )}
                      </ActionIcon>
                    </Tooltip>
                  ) : (
                    <Tooltip label="Favori eklemek için giriş yapın">
                      <ActionIcon variant="subtle" color="gray" disabled>
                        <IconStar size={18} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
