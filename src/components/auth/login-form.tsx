"use client";

import {
  Anchor,
  Button,
  Group,
  PasswordInput,
  Text,
  TextInput,
  Title,
  Stack,
  Alert,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { IconAlertCircle } from "@tabler/icons-react";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
  onSuccess?: () => void;
}

export function LoginForm({ onSwitchToRegister, onSwitchToForgotPassword, onSuccess }: LoginFormProps) {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Geçersiz email"),
      password: (value) => (value.length < 6 ? "Şifre en az 6 karakter olmalı" : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);

    const { error } = await signIn(values.email, values.password);

    if (error) {
      setError(error.message || "Giriş başarısız");
      setLoading(false);
    } else {
      onSuccess?.();
    }
  };

  return (
    <Stack gap="md">
      <div>
        <Title ta="center" order={2} mb="xs">
          Hoş Geldiniz!
        </Title>
        <Text c="dimmed" size="sm" ta="center">
          Hesabınız yok mu?{" "}
          <Anchor component="button" type="button" onClick={onSwitchToRegister} size="sm" fw={500}>
            Hesap oluştur
          </Anchor>
        </Text>
      </div>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Hata"
          color="red"
        >
          {error}
        </Alert>
      )}

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Email"
            placeholder="ornek@email.com"
            required
            size="md"
            {...form.getInputProps("email")}
          />
          <PasswordInput
            label="Şifre"
            placeholder="Şifrenizi girin"
            required
            size="md"
            {...form.getInputProps("password")}
          />
          <Group justify="flex-end" mt="xs">
            <Anchor component="button" type="button" onClick={onSwitchToForgotPassword} size="sm">
              Şifremi unuttum?
            </Anchor>
          </Group>
          <Button fullWidth mt="md" size="md" type="submit" loading={loading}>
            Giriş Yap
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
