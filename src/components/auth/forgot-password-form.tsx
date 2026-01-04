"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import {
  Anchor,
  Button,
  Group,
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

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
}

export function ForgotPasswordForm({ onSwitchToLogin }: ForgotPasswordFormProps) {
  const { resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    initialValues: {
      email: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Geçersiz email"),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error } = await resetPassword(values.email);

    if (error) {
      setError((error as { message?: string }).message || "Şifre sıfırlama başarısız");
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <div>
        <Title ta="center" order={2} mb="xs">
          Şifrenizi mi unuttunuz?
        </Title>
        <Text c="dimmed" fz="sm" ta="center">
          Email adresinizi girin, size şifre sıfırlama linki gönderelim
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
          Şifre sıfırlama linki email adresinize gönderildi. Lütfen email kutunuzu kontrol edin.
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
          <Group justify="space-between" mt="md">
            <Anchor
              c="dimmed"
              size="sm"
              component="button"
              type="button"
              onClick={onSwitchToLogin}
              className="flex items-center gap-1"
            >
              <IconArrowLeft size={12} stroke={1.5} />
              <span className="ml-1">Giriş sayfasına dön</span>
            </Anchor>
            <Button type="submit" size="md" loading={loading}>
              Şifre Sıfırla
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
}
