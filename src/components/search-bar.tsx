"use client";

import { TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function SearchBar({ value, onChange, placeholder = "Coin ara...", label }: SearchBarProps) {
  return (
    <TextInput
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      leftSection={<IconSearch size={16} />}
      size="sm"
      style={{ width: 300 }}
    />
  );
}
