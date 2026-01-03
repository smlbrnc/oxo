# Mantine UI Kullanım Kılavuzu

## 📚 İçindekiler

1. [Mantine Nedir?](#mantine-nedir)
2. [Kurulum ve Yapılandırma](#kurulum-ve-yapılandırma)
3. [Temel Yapı ve Konseptler](#temel-yapı-ve-konseptler)
4. [Komponentler](#komponentler)
5. [Hooks](#hooks)
6. [Tema ve Stil Yönetimi](#tema-ve-stil-yönetimi)
7. [Responsive Tasarım](#responsive-tasarım)
8. [TailwindCSS Entegrasyonu](#tailwindcss-entegrasyonu)
9. [En İyi Uygulamalar](#en-iyi-uygulamalar)
10. [Proje Örnekleri](#proje-örnekleri)

---

## Mantine Nedir?

**Mantine**, React için geliştirilmiş kapsamlı bir UI komponent kütüphanesidir. 120'den fazla responsive ve özelleştirilebilir komponent sunar ve modern web uygulamalarının geliştirilmesini hızlandırır.

### Temel Özellikler

- ✅ **120+ Komponent**: Butonlar, formlar, modaller, tablolar ve daha fazlası
- ✅ **TypeScript Desteği**: Tam tip güvenliği
- ✅ **Dark Mode**: Otomatik tema desteği
- ✅ **Accessibility**: WCAG standartlarına uyumlu
- ✅ **Responsive**: Mobil-first yaklaşım
- ✅ **Özelleştirilebilir**: Tema sistemi ile kolay stil yönetimi
- ✅ **Hooks**: 50+ yardımcı hook

---

## Kurulum ve Yapılandırma

### Paket Kurulumu

```bash
npm install @mantine/core @mantine/hooks
npm install @tabler/icons-react  # İkonlar için
npm install @mantinex/mantine-logo  # Logo için (opsiyonel)
```

### Next.js Entegrasyonu

#### 1. Root Layout Yapılandırması

```tsx
// src/app/layout.tsx
import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import theme from "./theme";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider theme={theme}>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
```

#### 2. Tema Yapılandırması

```tsx
// src/app/theme.ts
import { createTheme } from "@mantine/core";

const theme = createTheme({
  // Breakpoint'ler (responsive)
  breakpoints: {
    xs: "36em",   // 576px
    sm: "48em",   // 768px
    md: "62em",   // 992px
    lg: "75em",   // 1200px
    xl: "88em",   // 1408px
  },
  
  // Özel renkler
  colors: {
    brand: [
      "#e6f7ff",
      "#bae7ff",
      "#91d5ff",
      "#69c0ff",
      "#40a9ff",
      "#1890ff",
      "#096dd9",
      "#0050b3",
      "#003a8c",
      "#002766",
    ],
  },
  
  // Varsayılan renk şeması
  defaultColorScheme: "auto", // 'light' | 'dark' | 'auto'
  
  // Font ayarları
  fontFamily: "Inter, sans-serif",
  
  // Spacing
  spacing: {
    xs: "0.5rem",
    sm: "0.75rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
});

export default theme;
```

---

## Temel Yapı ve Konseptler

### 1. AppShell - Uygulama İskeleti

`AppShell`, uygulamanın genel yapısını oluşturur:

```tsx
import { AppShell } from "@mantine/core";

function Layout() {
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: "sm" }}
      padding="md"
    >
      <AppShell.Header>Header İçeriği</AppShell.Header>
      <AppShell.Navbar>Navbar İçeriği</AppShell.Navbar>
      <AppShell.Main>Ana İçerik</AppShell.Main>
    </AppShell>
  );
}
```

**AppShell Bölümleri:**
- `AppShell.Header`: Üst kısım (navigation, logo)
- `AppShell.Navbar`: Sol sidebar
- `AppShell.Aside`: Sağ sidebar
- `AppShell.Footer`: Alt kısım
- `AppShell.Main`: Ana içerik alanı

### 2. Container - İçerik Kapsayıcı

```tsx
import { Container } from "@mantine/core";

<Container size="sm">  {/* xs | sm | md | lg | xl | fluid */}
  İçerik
</Container>
```

### 3. Group - Yatay Gruplama

```tsx
import { Group } from "@mantine/core";

<Group gap="md" justify="space-between">
  <Button>Sol</Button>
  <Button>Sağ</Button>
</Group>
```

**Props:**
- `gap`: Elemanlar arası boşluk
- `justify`: Hizalama (`flex-start`, `center`, `flex-end`, `space-between`)
- `align`: Dikey hizalama

### 4. Stack - Dikey Gruplama

```tsx
import { Stack } from "@mantine/core";

<Stack gap="md">
  <div>Üst</div>
  <div>Orta</div>
  <div>Alt</div>
</Stack>
```

---

## Komponentler

### Butonlar

```tsx
import { Button, ButtonGroup } from "@mantine/core";

<Button variant="filled" color="blue" size="md">
  Tıkla
</Button>

<Button variant="outline">Çerçeveli</Button>
<Button variant="subtle">Hafif</Button>
<Button variant="light">Açık</Button>
<Button variant="gradient">Gradient</Button>
```

**Variant'lar:**
- `filled`: Dolu buton (varsayılan)
- `outline`: Çerçeveli
- `subtle`: Hafif arka plan
- `light`: Açık renkli
- `gradient`: Gradient arka plan

### Form Elemanları

```tsx
import { TextInput, Select, Checkbox, Radio } from "@mantine/core";

<TextInput
  label="İsim"
  placeholder="Adınızı girin"
  required
  error="Hata mesajı"
/>

<Select
  label="Şehir"
  placeholder="Seçiniz"
  data={["İstanbul", "Ankara", "İzmir"]}
/>

<Checkbox label="Kabul ediyorum" />
<Radio label="Seçenek 1" value="1" />
```

### Modal ve Drawer

```tsx
import { Modal, Drawer } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

function Demo() {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Button onClick={open}>Modal Aç</Button>
      <Modal opened={opened} onClose={close} title="Başlık">
        İçerik
      </Modal>
    </>
  );
}
```

### Menu ve Dropdown

```tsx
import { Menu } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";

<Menu trigger="hover" withinPortal>
  <Menu.Target>
    <Button>
      Menü <IconChevronDown size={14} />
    </Button>
  </Menu.Target>
  <Menu.Dropdown>
    <Menu.Item>Seçenek 1</Menu.Item>
    <Menu.Item>Seçenek 2</Menu.Item>
    <Menu.Divider />
    <Menu.Item color="red">Sil</Menu.Item>
  </Menu.Dropdown>
</Menu>
```

**Menu Trigger:**
- `click`: Tıklama ile açılır
- `hover`: Fare üzerine gelince açılır

### Paper - Kart Komponenti

```tsx
import { Paper } from "@mantine/core";

<Paper shadow="md" p="lg" radius="md" withBorder>
  <Text>Kart içeriği</Text>
</Paper>
```

**Props:**
- `shadow`: Gölge (`xs`, `sm`, `md`, `lg`, `xl`)
- `p`: Padding
- `radius`: Köşe yuvarlaklığı
- `withBorder`: Kenarlık ekler

### Typography

```tsx
import { Title, Text } from "@mantine/core";

<Title order={1}>Başlık 1</Title>
<Title order={2}>Başlık 2</Title>

<Text size="sm">Küçük metin</Text>
<Text size="md">Orta metin</Text>
<Text size="lg">Büyük metin</Text>

<Text
  variant="gradient"
  gradient={{ from: "blue", to: "cyan" }}
>
  Gradient metin
</Text>
```

### Badge ve Avatar

```tsx
import { Badge, Avatar } from "@mantine/core";

<Badge color="blue" variant="filled">Yeni</Badge>
<Badge color="red" variant="dot">Aktif</Badge>

<Avatar src="image.png" alt="Kullanıcı" />
<Avatar color="blue">AB</Avatar> {/* İlk harfler */}
```

### Burger Menu (Mobil)

```tsx
import { Burger } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

function MobileMenu() {
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <Burger opened={opened} onClick={toggle} size="sm" />
  );
}
```

---

## Hooks

### useDisclosure - Boolean State Yönetimi

Modal, drawer, dropdown gibi açılır/kapanır komponentler için:

```tsx
import { useDisclosure } from "@mantine/hooks";

function Demo() {
  const [opened, { open, close, toggle }] = useDisclosure(false);

  return (
    <>
      <Button onClick={open}>Aç</Button>
      <Button onClick={close}>Kapat</Button>
      <Button onClick={toggle}>Toggle</Button>
      {opened && <div>Açık</div>}
    </>
  );
}
```

### useMantineColorScheme - Tema Yönetimi

```tsx
import { useMantineColorScheme } from "@mantine/core";

function ThemeSwitcher() {
  const { colorScheme, setColorScheme, clearColorScheme } = 
    useMantineColorScheme();

  return (
    <Group>
      <Button onClick={() => setColorScheme("light")}>Açık</Button>
      <Button onClick={() => setColorScheme("dark")}>Koyu</Button>
      <Button onClick={() => setColorScheme("auto")}>Otomatik</Button>
      <Button onClick={clearColorScheme}>Temizle</Button>
    </Group>
  );
}
```

### useColorScheme - Sistem Tema Algılama

```tsx
import { useColorScheme } from "@mantine/hooks";

function Demo() {
  const colorScheme = useColorScheme(); // 'light' | 'dark'

  return (
    <Text>
      Sistem teması: {colorScheme}
    </Text>
  );
}
```

### Diğer Önemli Hooks

```tsx
import { 
  useDebouncedValue,    // Debounce değer
  useMediaQuery,        // Media query kontrolü
  useClickOutside,      // Dışarı tıklama algılama
  useHover,             // Hover durumu
  useScrollIntoView,    // Scroll yönlendirme
} from "@mantine/hooks";
```

---

## Tema ve Stil Yönetimi

### Tema Özelleştirme

```tsx
// src/app/theme.ts
import { createTheme } from "@mantine/core";

const theme = createTheme({
  // Renkler
  colors: {
    brand: [
      "#e6f7ff",
      "#bae7ff",
      // ... 10 ton
    ],
  },
  
  // Varsayılan renk
  primaryColor: "brand",
  
  // Fontlar
  fontFamily: "Inter, sans-serif",
  fontFamilyMonospace: "Fira Code, monospace",
  
  // Font boyutları
  fontSizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
  },
  
  // Radius (köşe yuvarlaklığı)
  radius: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
  },
  
  // Spacing
  spacing: {
    xs: "0.5rem",
    sm: "0.75rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
  
  // Shadows
  shadows: {
    xs: "0 1px 3px rgba(0, 0, 0, 0.05)",
    sm: "0 1px 2px rgba(0, 0, 0, 0.1)",
    // ...
  },
});

export default theme;
```

### Dark Mode Yönetimi

Mantine otomatik olarak dark mode'u yönetir. `data-mantine-color-scheme` attribute'u ile kontrol edilir:

```tsx
// Otomatik tema değişimi
<MantineProvider theme={theme} defaultColorScheme="auto">
  {children}
</MantineProvider>
```

### CSS Variables Kullanımı

Mantine, CSS değişkenleri kullanır:

```css
/* globals.css */
:root {
  --mantine-color-blue-6: #228be6;
  --mantine-spacing-md: 1rem;
  --mantine-radius-md: 0.75rem;
}
```

---

## Responsive Tasarım

### Breakpoint'ler

```tsx
// Tema breakpoint'leri
breakpoints: {
  xs: "36em",   // 576px
  sm: "48em",   // 768px
  md: "62em",   // 992px
  lg: "75em",   // 1200px
  xl: "88em",   // 1408px
}
```

### visibleFrom ve hiddenFrom

```tsx
import { Group, Burger } from "@mantine/core";

<Group visibleFrom="sm">
  {/* Sadece sm ve üzeri ekranlarda görünür */}
  <Button>Desktop Menü</Button>
</Group>

<Burger hiddenFrom="sm" />
{/* Sadece sm altı ekranlarda görünür */}
```

### Responsive Props

```tsx
<Container
  size={{
    base: "100%",
    sm: "540px",
    md: "720px",
    lg: "960px",
    xl: "1140px",
  }}
>
  İçerik
</Container>
```

### useMediaQuery Hook

```tsx
import { useMediaQuery } from "@mantine/hooks";

function Demo() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? <MobileView /> : <DesktopView />;
}
```

---

## TailwindCSS Entegrasyonu

### tailwind-preset-mantine

Projenizde `tailwind-preset-mantine` kullanılıyor. Bu preset, Mantine'in tema değerlerini TailwindCSS ile uyumlu hale getirir.

### Dark Mode Senkronizasyonu

```js
// tailwind.config.js
module.exports = {
  darkMode: ['class', '[data-mantine-color-scheme="dark"]'],
  // ...
};
```

### Birlikte Kullanım

Mantine komponentleri ve TailwindCSS sınıfları birlikte kullanılabilir:

```tsx
<Button className="mt-4 hover:scale-105 transition-transform">
  Mantine + Tailwind
</Button>
```

**Öneri:** Mantine'in kendi stil sistemi ile tutarlılık için, mümkün olduğunca Mantine props'larını kullanın, TailwindCSS'i özel durumlar için kullanın.

---

## En İyi Uygulamalar

### 1. Client Components

Mantine komponentleri genellikle client-side etkileşim gerektirir. Next.js'te `"use client"` direktifi kullanın:

```tsx
"use client";

import { Button } from "@mantine/core";

export function MyComponent() {
  return <Button>Tıkla</Button>;
}
```

### 2. Import Optimizasyonu

```tsx
// ✅ İyi - Tree-shaking için
import { Button, Group } from "@mantine/core";

// ❌ Kötü - Tüm kütüphaneyi yükler
import * as Mantine from "@mantine/core";
```

### 3. Portal Kullanımı

Dropdown ve modal gibi komponentlerde `withinPortal` kullanın:

```tsx
<Menu withinPortal>
  {/* Z-index sorunlarını önler */}
</Menu>
```

### 4. TypeScript Tip Güvenliği

```tsx
import type { ButtonProps } from "@mantine/core";

interface CustomButtonProps extends ButtonProps {
  customProp?: string;
}

function CustomButton({ customProp, ...props }: CustomButtonProps) {
  return <Button {...props}>{customProp}</Button>;
}
```

### 5. Performans Optimizasyonu

```tsx
// useMemo ile ağır hesaplamaları önbelleğe alın
const items = useMemo(() => 
  data.map(item => ({ value: item.id, label: item.name })),
  [data]
);

<Select data={items} />
```

### 6. Erişilebilirlik

Mantine komponentleri erişilebilirlik standartlarına uygundur. Ekstra `aria-*` attribute'ları genellikle gerekmez, ancak özel durumlar için ekleyebilirsiniz.

---

## Proje Örnekleri

### Header Komponenti

```tsx
"use client";

import { IconChevronDown } from "@tabler/icons-react";
import { Burger, Center, Container, Group, Menu } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { MantineLogo } from "@mantinex/mantine-logo";

const links = [
  { link: "/about", label: "Hakkında" },
  {
    link: "#1",
    label: "Öğren",
    links: [
      { link: "/docs", label: "Dokümantasyon" },
      { link: "/resources", label: "Kaynaklar" },
    ],
  },
];

export function HeaderMenu() {
  const [opened, { toggle }] = useDisclosure(false);

  const items = links.map((link) => {
    const menuItems = link.links?.map((item) => (
      <Menu.Item key={item.link}>{item.label}</Menu.Item>
    ));

    if (menuItems) {
      return (
        <Menu
          key={link.label}
          trigger="hover"
          transitionProps={{ exitDuration: 0 }}
          withinPortal
        >
          <Menu.Target>
            <a href={link.link} className="link">
              <Center>
                <span>{link.label}</span>
                <IconChevronDown size={14} />
              </Center>
            </a>
          </Menu.Target>
          <Menu.Dropdown>{menuItems}</Menu.Dropdown>
        </Menu>
      );
    }

    return (
      <a key={link.label} href={link.link}>
        {link.label}
      </a>
    );
  });

  return (
    <header className="header">
      <Container size="md">
        <div className="inner">
          <MantineLogo size={28} />
          <Group gap={5} visibleFrom="sm">
            {items}
          </Group>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" />
        </div>
      </Container>
    </header>
  );
}
```

### Form Örneği

```tsx
"use client";

import { TextInput, Button, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";

export function ContactForm() {
  const form = useForm({
    initialValues: {
      name: "",
      email: "",
    },
    validate: {
      name: (value) => (value.length < 2 ? "En az 2 karakter" : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Geçersiz email"),
    },
  });

  return (
    <form onSubmit={form.onSubmit((values) => console.log(values))}>
      <Stack gap="md">
        <TextInput
          label="İsim"
          placeholder="Adınız"
          {...form.getInputProps("name")}
        />
        <TextInput
          label="Email"
          placeholder="email@example.com"
          {...form.getInputProps("email")}
        />
        <Button type="submit">Gönder</Button>
      </Stack>
    </form>
  );
}
```

### Modal Örneği

```tsx
"use client";

import { Modal, Button, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

export function ConfirmModal() {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Button onClick={open}>Modal Aç</Button>
      <Modal
        opened={opened}
        onClose={close}
        title="Onay"
        centered
      >
        <Text>Emin misiniz?</Text>
        <Button onClick={close}>Kapat</Button>
      </Modal>
    </>
  );
}
```

---

## Kaynaklar

- **Resmi Dokümantasyon**: [mantine.dev](https://mantine.dev)
- **Komponentler**: [mantine.dev/core](https://mantine.dev/core)
- **Hooks**: [mantine.dev/hooks](https://mantine.dev/hooks)
- **GitHub**: [github.com/mantinedev/mantine](https://github.com/mantinedev/mantine)
- **Discord**: Mantine topluluğu

---

## Sonuç

Mantine, modern React uygulamaları için güçlü ve esnek bir UI kütüphanesidir. Bu kılavuz, projenizde Mantine'i etkili bir şekilde kullanmanız için gerekli temel bilgileri içermektedir.

**Önemli Notlar:**
- Her zaman resmi dokümantasyonu referans alın
- TypeScript kullanarak tip güvenliğini sağlayın
- Responsive tasarım için breakpoint'leri doğru kullanın
- Dark mode desteğini unutmayın
- Performans için gereksiz re-render'ları önleyin

Başarılar! 🚀
