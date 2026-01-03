"use client";

import { Group, Text } from "@mantine/core";
import Link from "next/link";
import { IconCoins } from "@tabler/icons-react";

interface LogoProps {
  size?: number;
  showText?: boolean;
}

export function Logo({ size = 28, showText = true }: LogoProps) {
  return (
    <Link href="/" className="no-underline">
      <Group gap="xs" className="items-center">
        <IconCoins
          size={size}
          className="text-blue-600 dark:text-blue-400"
          stroke={2}
        />
        {showText && (
          <Text
            fw={700}
            size={size > 24 ? "lg" : "md"}
            className="text-gray-900 dark:text-gray-100"
          >
            CryptoView
          </Text>
        )}
      </Group>
    </Link>
  );
}
