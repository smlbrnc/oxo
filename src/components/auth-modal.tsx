"use client";

import { Modal, Drawer } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { LoginForm } from "./auth/login-form";
import { RegisterForm } from "./auth/register-form";
import { ForgotPasswordForm } from "./auth/forgot-password-form";
import { useState, useEffect } from "react";

type AuthView = "login" | "register" | "forgot-password";

interface AuthModalProps {
  opened: boolean;
  onClose: () => void;
  defaultView?: AuthView;
}

export function AuthModal({ opened, onClose, defaultView = "login" }: AuthModalProps) {
  const [currentView, setCurrentView] = useState<AuthView>(defaultView);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (opened) {
      setCurrentView(defaultView);
    }
  }, [defaultView, opened]);

  const handleClose = () => {
    setCurrentView(defaultView);
    onClose();
  };

  const renderContent = () => {
    switch (currentView) {
      case "login":
        return (
          <LoginForm
            onSwitchToRegister={() => setCurrentView("register")}
            onSwitchToForgotPassword={() => setCurrentView("forgot-password")}
            onSuccess={handleClose}
          />
        );
      case "register":
        return (
          <RegisterForm
            onSwitchToLogin={() => setCurrentView("login")}
            onSuccess={handleClose}
          />
        );
      case "forgot-password":
        return (
          <ForgotPasswordForm onSwitchToLogin={() => setCurrentView("login")} />
        );
    }
  };

  if (isMobile) {
    return (
      <Drawer
        opened={opened}
        onClose={handleClose}
        title={currentView === "login" ? "Giriş Yap" : currentView === "register" ? "Kayıt Ol" : "Şifre Sıfırla"}
        position="bottom"
        size="auto"
        padding="md"
      >
        {renderContent()}
      </Drawer>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={currentView === "login" ? "Giriş Yap" : currentView === "register" ? "Kayıt Ol" : "Şifre Sıfırla"}
      centered
      size={420}
      padding="xl"
      radius="md"
    >
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        {renderContent()}
      </div>
    </Modal>
  );
}
