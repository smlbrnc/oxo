"use client";

import { NumberInput, Group, Button, Menu, Stack, Badge, Drawer, Text } from "@mantine/core";
import { IconFilter, IconX } from "@tabler/icons-react";
import { FilterOptions } from "@/lib/types";
import { useState } from "react";
import { useMediaQuery } from "@mantine/hooks";

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onReset: () => void;
}

export function FilterPanel({ filters, onFiltersChange, onReset }: FilterPanelProps) {
  const [opened, setOpened] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Aktif filtre sayısını hesapla
  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== null
  ).length;

  const hasActiveFilters = activeFiltersCount > 0;

  const filterContent = (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Text fw={600} size="lg">
          Filtrele
        </Text>
        {hasActiveFilters && (
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconX size={14} />}
            onClick={() => {
              onReset();
            }}
          >
            Sıfırla
          </Button>
        )}
      </Group>

      <NumberInput
        label="Min Fiyat (USD)"
        placeholder="0"
        value={filters.minPrice || ""}
        onChange={(value) =>
          onFiltersChange({
            ...filters,
            minPrice: typeof value === "number" ? value : undefined,
          })
        }
        min={0}
        decimalScale={2}
        thousandSeparator=","
        size="sm"
      />

      <NumberInput
        label="Max Fiyat (USD)"
        placeholder="Sınırsız"
        value={filters.maxPrice || ""}
        onChange={(value) =>
          onFiltersChange({
            ...filters,
            maxPrice: typeof value === "number" ? value : undefined,
          })
        }
        min={0}
        decimalScale={2}
        thousandSeparator=","
        size="sm"
      />

      <NumberInput
        label="Min Market Cap (USD)"
        placeholder="0"
        value={filters.minMarketCap || ""}
        onChange={(value) =>
          onFiltersChange({
            ...filters,
            minMarketCap: typeof value === "number" ? value : undefined,
          })
        }
        min={0}
        decimalScale={0}
        thousandSeparator=","
        size="sm"
      />

      <NumberInput
        label="Max Market Cap (USD)"
        placeholder="Sınırsız"
        value={filters.maxMarketCap || ""}
        onChange={(value) =>
          onFiltersChange({
            ...filters,
            maxMarketCap: typeof value === "number" ? value : undefined,
          })
        }
        min={0}
        decimalScale={0}
        thousandSeparator=","
        size="sm"
      />
    </Stack>
  );

  if (isMobile) {
    return (
      <>
        <Button
          variant={hasActiveFilters ? "filled" : "default"}
          leftSection={<IconFilter size={16} />}
          rightSection={
            hasActiveFilters ? (
              <Badge size="sm" variant="filled" circle>
                {activeFiltersCount}
              </Badge>
            ) : null
          }
          size="sm"
          onClick={() => setOpened(true)}
        >
          Filtrele
        </Button>
        <Drawer
          opened={opened}
          onClose={() => setOpened(false)}
          position="bottom"
          title="Filtrele"
          padding="md"
          styles={{
            content: {
              maxHeight: "60vh",
            },
            body: {
              overflowY: "auto",
            },
          }}
        >
          {filterContent}
        </Drawer>
      </>
    );
  }

  return (
    <Menu
      shadow="md"
      width={320}
      position="bottom-end"
      opened={opened}
      onChange={setOpened}
      withinPortal
    >
      <Menu.Target>
        <Button
          variant={hasActiveFilters ? "filled" : "default"}
          leftSection={<IconFilter size={16} />}
          rightSection={
            hasActiveFilters ? (
              <Badge size="sm" variant="filled" circle>
                {activeFiltersCount}
              </Badge>
            ) : null
          }
          size="sm"
        >
          Filtrele
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Stack gap="md" p="md">
          {filterContent}
        </Stack>
      </Menu.Dropdown>
    </Menu>
  );
}
