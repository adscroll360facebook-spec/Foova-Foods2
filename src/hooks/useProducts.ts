import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type SupabaseProduct = Tables<"products">;

export function useProducts() {
  const [products, setProducts] = useState<SupabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    load();

    // Real-time subscription so stock changes reflect instantly
    const channel = supabase
      .channel("products-stock")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { products, loading, reload: load };
}

/** Derive stock status from a product record */
export function getStockStatus(qty: number) {
  if (qty === 0) return "out" as const;
  if (qty <= 10) return "low" as const;
  return "in" as const;
}
