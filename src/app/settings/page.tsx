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
  Group,
  Switch,
  Tooltip,
  Divider,
  SimpleGrid,
} from "@mantine/core";
import { IconSun, IconMoonStars, IconCheck, IconX } from "@tabler/icons-react";
import { useAuth } from "@/contexts/auth-context";
import { useMantineColorScheme } from "@mantine/core";
import { useState, useEffect, useCallback } from "react";
import { getOrCreateUserSettings, updateUserSettings } from "@/lib/supabase/settings";
import { UserSettings, ColorMode } from "@/lib/types";

export default function SettingsPage() {
  const { user } = useAuth();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const settingsLoaded = useState(false)[0]; // This is a bit hacky, let's use a proper state

  useEffect(() => {
    let mounted = true;

    async function fetchSettings() {
      if (!user?.id) return;
      
      try {
        const userSettings = await getOrCreateUserSettings(user.id);
        if (mounted) {
          setSettings(userSettings);
          setLoading(false);
          
          // Sync color scheme with settings - only if different
          // We don't include colorScheme in dependencies to avoid loops
          if (userSettings.color_mode !== "auto") {
            setColorScheme(userSettings.color_mode);
          }
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        if (mounted) setLoading(false);
      }
    }

    if (user?.id) {
      fetchSettings();
    } else {
      // If no user after 2 seconds, stop loading
      const timer = setTimeout(() => {
        if (mounted && !user?.id) setLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleColorModeChange = async (checked: boolean) => {
    if (!user?.id || !settings) return;

    // Toggle between light and dark (auto mode için ayrı bir switch eklenebilir)
    const newColorMode: ColorMode = checked ? "dark" : "light";
    setSaving(true);

    try {
      const { data, error } = await updateUserSettings(user.id, {
        color_mode: newColorMode,
      });

      if (!error && data) {
        setSettings(data);
        setColorScheme(newColorMode);
      }
    } catch (error) {
      console.error("Error updating color mode:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationsChange = async (checked: boolean) => {
    if (!user?.id || !settings) return;

    setSaving(true);
    try {
      const { data, error } = await updateUserSettings(user.id, {
        notifications_enabled: checked,
      });

      if (!error && data) {
        setSettings(data);
      }
    } catch (error) {
      console.error("Error updating notifications:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEmailNotificationsChange = async (checked: boolean) => {
    if (!user?.id || !settings) return;

    setSaving(true);
    try {
      const { data, error } = await updateUserSettings(user.id, {
        email_notifications: checked,
      });

      if (!error && data) {
        setSettings(data);
      }
    } catch (error) {
      console.error("Error updating email notifications:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell header={{ height: 110 }} padding={0}>
        <HeaderMenu />
        <AppShellMain className="pt-4">
          <Container size="xl">
            <Stack gap="xl" align="center" py="xl">
              <Text>Yükleniyor...</Text>
            </Stack>
            <Footer />
          </Container>
        </AppShellMain>
      </AppShell>
    );
  }

  if (!user?.id) {
    return (
      <AppShell header={{ height: 110 }} padding={0}>
        <HeaderMenu />
        <AppShellMain className="pt-4">
          <Container size="xl">
            <Stack gap="xl" align="center" py="xl">
              <Title order={2}>Giriş Yapın</Title>
              <Text c="dimmed" ta="center">
                Ayarları görüntülemek için giriş yapmanız gerekiyor.
              </Text>
            </Stack>
            <Footer />
          </Container>
        </AppShellMain>
      </AppShell>
    );
  }

  const isDarkMode = settings?.color_mode === "dark" || (settings?.color_mode === "auto" && colorScheme === "dark");

  return (
    <AppShell header={{ height: 110 }} padding={0}>
      <HeaderMenu />
      <AppShellMain className="pt-4">
        <Container size="xl">
          <Stack gap="xl">
            <Title order={1}>Hesap Ayarları</Title>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              {/* Görünüm Ayarları */}
              <Paper p="md" withBorder radius="md">
                <Stack gap="sm">
                  <Title order={3}>Görünüm Ayarları</Title>
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Text fw={500}>Tema Modu</Text>
                      <Text size="sm" c="dimmed">
                        Açık veya koyu tema seçin
                      </Text>
                    </Stack>
                    <Switch
                      size="md"
                      color="dark.4"
                      checked={isDarkMode}
                      onChange={(e) => handleColorModeChange(e.currentTarget.checked)}
                      disabled={saving}
                      onLabel={<IconSun size={16} stroke={2.5} color="var(--mantine-color-yellow-4)" />}
                      offLabel={<IconMoonStars size={16} stroke={2.5} color="var(--mantine-color-blue-6)" />}
                    />
                  </Group>
                </Stack>
              </Paper>

              {/* Bildirim Ayarları */}
              <Paper p="md" withBorder radius="md">
                <Stack gap="sm">
                  <Title order={3}>Bildirim Ayarları</Title>
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Text fw={500}>Bildirimler</Text>
                      <Text size="sm" c="dimmed">
                        Uygulama içi bildirimleri aç/kapat
                      </Text>
                    </Stack>
                    <Switch
                      checked={settings?.notifications_enabled ?? true}
                      onChange={(e) => handleNotificationsChange(e.currentTarget.checked)}
                      color="teal"
                      size="md"
                      disabled={saving}
                      thumbIcon={
                        settings?.notifications_enabled ? (
                          <IconCheck size={12} color="var(--mantine-color-teal-6)" stroke={3} />
                        ) : (
                          <IconX size={12} color="var(--mantine-color-red-6)" stroke={3} />
                      )
                    }
                  />
                  </Group>
                </Stack>
              </Paper>

              {/* Email Ayarları */}
              <Paper p="md" withBorder radius="md">
                <Stack gap="sm">
                  <Title order={3}>Email Ayarları</Title>
                  <Tooltip label="Email bildirimleri açık olduğunda önemli güncellemeler email adresinize gönderilir">
                    <Group justify="space-between" align="center" wrap="nowrap">
                      <Stack gap={4} style={{ flex: 1 }}>
                        <Text fw={500}>Email Bildirimleri</Text>
                        <Text size="sm" c="dimmed">
                          Önemli güncellemeler için email bildirimleri alın
                        </Text>
                      </Stack>
                      <Switch
                        checked={settings?.email_notifications ?? true}
                        onChange={(e) => handleEmailNotificationsChange(e.currentTarget.checked)}
                        color="teal"
                        size="md"
                        disabled={saving}
                        thumbIcon={
                          settings?.email_notifications ? (
                            <IconCheck size={12} color="var(--mantine-color-teal-6)" stroke={3} />
                          ) : (
                            <IconX size={12} color="var(--mantine-color-red-6)" stroke={3} />
                        )
                      }
                    />
                    </Group>
                  </Tooltip>
                </Stack>
              </Paper>
            </SimpleGrid>

            <Divider label="Gelecek Özellikler" labelPosition="center" />

            {/* Gelecek Özellikler */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Paper p="md" withBorder radius="md" style={{ opacity: 0.6 }}>
                <Stack gap="sm">
                  <Title order={3}>Gelecek Özellikler</Title>
                  <Text size="sm" c="dimmed">
                    Bu özellikler yakında eklenecek
                  </Text>

                  {/* Price Alerts - TODO */}
                  <Group justify="space-between" align="center" wrap="nowrap" mt="sm">
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Text fw={500}>Fiyat Uyarıları</Text>
                      <Text size="sm" c="dimmed">
                        Belirlediğiniz fiyat seviyelerine ulaşıldığında bildirim alın
                      </Text>
                    </Stack>
                    <Switch
                      checked={settings?.price_alerts ?? false}
                      onChange={() => {}}
                      color="teal"
                      size="md"
                      disabled
                      thumbIcon={
                        settings?.price_alerts ? (
                          <IconCheck size={12} color="var(--mantine-color-teal-6)" stroke={3} />
                        ) : (
                          <IconX size={12} color="var(--mantine-color-red-6)" stroke={3} />
                      )
                    }
                  />
                  </Group>
                  {/* TODO: Implement price alerts functionality
                    - Create price_alerts table in Supabase
                    - Add UI for creating/editing price alerts
                    - Implement notification system for price alerts
                  */}
                </Stack>
              </Paper>

              {/* Newsletter - TODO */}
              <Paper p="md" withBorder radius="md" style={{ opacity: 0.6 }}>
                <Stack gap="sm">
                  <Title order={3}>Haber Bülteni</Title>
                  <Group justify="space-between" align="center" wrap="nowrap" mt="sm">
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Text fw={500}>Haber Bülteni</Text>
                      <Text size="sm" c="dimmed">
                        Kripto para piyasası haberleri ve analizleri için haber bültenine abone olun
                      </Text>
                    </Stack>
                    <Switch
                      checked={settings?.newsletter ?? false}
                      onChange={() => {}}
                      color="teal"
                      size="md"
                      disabled
                      thumbIcon={
                        settings?.newsletter ? (
                          <IconCheck size={12} color="var(--mantine-color-teal-6)" stroke={3} />
                        ) : (
                          <IconX size={12} color="var(--mantine-color-red-6)" stroke={3} />
                      )
                    }
                  />
                  </Group>
                  {/* TODO: Implement newsletter subscription
                    - Integrate with email service provider (e.g., SendGrid, Mailchimp)
                    - Add newsletter subscription/unsubscription logic
                    - Create newsletter content management system
                  */}
                </Stack>
              </Paper>

              {/* Two Factor Auth - TODO */}
              <Paper p="md" withBorder radius="md" style={{ opacity: 0.6 }}>
                <Stack gap="sm">
                  <Title order={3}>Güvenlik</Title>
                  <Group justify="space-between" align="center" wrap="nowrap" mt="sm">
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Text fw={500}>İki Faktörlü Kimlik Doğrulama</Text>
                      <Text size="sm" c="dimmed">
                        Hesabınızı ekstra güvenlik katmanı ile koruyun
                      </Text>
                    </Stack>
                    <Switch
                      checked={settings?.two_factor_auth ?? false}
                      onChange={() => {}}
                      color="teal"
                      size="md"
                      disabled
                      thumbIcon={
                        settings?.two_factor_auth ? (
                          <IconCheck size={12} color="var(--mantine-color-teal-6)" stroke={3} />
                        ) : (
                          <IconX size={12} color="var(--mantine-color-red-6)" stroke={3} />
                      )
                    }
                  />
                  </Group>
                  {/* TODO: Implement two-factor authentication
                    - Integrate with TOTP library (e.g., speakeasy)
                    - Add QR code generation for authenticator apps
                    - Implement backup codes system
                    - Add verification flow for 2FA setup
                  */}
                </Stack>
              </Paper>
            </SimpleGrid>

            <Footer />
          </Stack>
        </Container>
      </AppShellMain>
    </AppShell>
  );
}
