import { createClient } from "./client";
import { UserSettings, ColorMode } from "../types";

/**
 * Get user settings from database
 */
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No settings found, return null
      return null;
    }
    console.error("Error fetching user settings:", error);
    return null;
  }

  return data;
}

/**
 * Create initial user settings
 */
export async function createUserSettings(
  userId: string,
  settings: Partial<UserSettings> = {}
): Promise<{ data: UserSettings | null; error: any }> {
  const supabase = createClient();

  const defaultSettings: Omit<UserSettings, "id" | "updated_at"> = {
    user_id: userId,
    color_mode: "auto",
    notifications_enabled: true,
    email_notifications: true,
    price_alerts: false,
    newsletter: false,
    two_factor_auth: false,
    ...settings,
  };

  const { data, error } = await supabase
    .from("user_settings")
    .insert(defaultSettings)
    .select()
    .single();

  if (error) {
    console.error("Error creating user settings:", error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  userId: string,
  settings: Partial<Omit<UserSettings, "id" | "user_id" | "updated_at">>
): Promise<{ data: UserSettings | null; error: any }> {
  const supabase = createClient();

  // Check if settings exist, if not create them
  const existing = await getUserSettings(userId);
  if (!existing) {
    return await createUserSettings(userId, settings);
  }

  const { data, error } = await supabase
    .from("user_settings")
    .update(settings)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating user settings:", error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Get or create user settings (helper function)
 */
export async function getOrCreateUserSettings(userId: string): Promise<UserSettings> {
  let settings = await getUserSettings(userId);

  if (!settings) {
    const { data } = await createUserSettings(userId);
    if (data) {
      settings = data;
    } else {
      // Fallback to default settings if creation fails
      settings = {
        user_id: userId,
        color_mode: "auto",
        notifications_enabled: true,
        email_notifications: true,
        price_alerts: false,
        newsletter: false,
        two_factor_auth: false,
      };
    }
  }

  return settings;
}
