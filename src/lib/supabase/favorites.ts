import { createClient } from "./client";

/**
 * Get all favorite coin IDs for a user
 */
export async function getUserFavorites(userId: string): Promise<string[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("user_favorites")
    .select("coin_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user favorites:", error);
    return [];
  }

  return data?.map((item) => item.coin_id) || [];
}

/**
 * Add a coin to user's favorites
 */
export async function addUserFavorite(userId: string, coinId: string): Promise<{ error: any }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("user_favorites")
    .insert({
      user_id: userId,
      coin_id: coinId,
    });

  if (error) {
    console.error("Error adding favorite:", error);
    return { error };
  }

  return { error: null };
}

/**
 * Remove a coin from user's favorites
 */
export async function removeUserFavorite(userId: string, coinId: string): Promise<{ error: any }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("coin_id", coinId);

  if (error) {
    console.error("Error removing favorite:", error);
    return { error };
  }

  return { error: null };
}

/**
 * Check if a coin is in user's favorites
 */
export async function isUserFavorite(userId: string, coinId: string): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("coin_id", coinId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}
