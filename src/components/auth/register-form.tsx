"use client";

import {
  Anchor,
  Button,
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
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
}

export function RegisterForm({ onSwitchToLogin, onSuccess }: RegisterFormProps) {
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Geçersiz email"),
      password: (value) => (value.length < 6 ? "Şifre en az 6 karakter olmalı" : null),
      confirmPassword: (value, values) =>
        value !== values.password ? "Şifreler eşleşmiyor" : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error } = await signUp(values.email, values.password);

    if (error) {
      setError(error.message || "Kayıt başarısız");
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        onSuccess?.();
        onSwitchToLogin();
      }, 2000);
    }
  };

  return (
    <Stack gap="md">
      <div>
        <Title ta="center" order={2} mb="xs">
          Hesap Oluştur
        </Title>
        <Text c="dimmed" size="sm" ta="center">
          Zaten hesabınız var mı?{" "}
          <Anchor component="button" type="button" onClick={onSwitchToLogin} size="sm" fw={500}>
            Giriş yap
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

      {success && (
        <Alert
          icon={<IconCheck size={16} />}
          title="Başarılı"
          color="green"
        >
          Hesabınız oluşturuldu! Giriş sayfasına yönlendiriliyorsunuz...
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
          <PasswordInput
            label="Şifre Tekrar"
            placeholder="Şifrenizi tekrar girin"
            required
            size="md"
            {...form.getInputProps("confirmPassword")}
          />
          <Button fullWidth mt="md" size="md" type="submit" loading={loading}>
            Kayıt Ol
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
