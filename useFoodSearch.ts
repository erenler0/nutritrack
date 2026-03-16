"use client";

// v2 — Supabase'i doğrudan çağırmak yerine /api/foods/search route'unu kullanır.
// Aggregator katmanı (Supabase cache → OFF API fallback) sunucu tarafında çalışır.

import { useState, useEffect, useCallback, useRef } from "react";
import type { Food } from "@/lib/supabase/database.types";

export interface FoodSearchParams {
  query?: string;
  mealType?: string;
  category?: string;
  macroFocus?: string;
  limit?: number;
  offset?: number;
}

interface UseFoodSearchOptions {
  debounceMs?: number;
  initialLimit?: number;
}

interface UseFoodSearchReturn {
  results: Food[];
  total: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

/**
 * Debounce'lu yiyecek arama hook'u.
 * SearchPage'de kullanılır; filtreler veya query değiştiğinde
 * 300ms bekler, sonra Supabase'e istek atar.
 */
export function useFoodSearch(
  params: SearchFoodsParams,
  options: UseFoodSearchOptions = {}
): UseFoodSearchReturn {
  const { debounceMs = 300, initialLimit = 20 } = options;

  const [results, setResults] = useState<Food[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchPage = useCallback(
    async (currentOffset: number, append = false) => {
      // Önceki isteği iptal et
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const result: SearchFoodsResult = await searchFoods({
          ...params,
          limit: initialLimit,
          offset: currentOffset,
        });

        if (result.error) {
          setError(result.error);
          return;
        }

        setResults((prev) => (append ? [...prev, ...result.data] : result.data));
        setTotal(result.count);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Arama sırasında bir hata oluştu.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(params), initialLimit]
  );

  // Parametreler değişince debounce ile sıfırdan ara
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setOffset(0);
      fetchPage(0, false);
    }, debounceMs);

    return () => {
      clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [fetchPage, debounceMs]);

  // Sayfalama: daha fazla yükle
  const loadMore = useCallback(() => {
    const next = offset + initialLimit;
    setOffset(next);
    fetchPage(next, true);
  }, [offset, initialLimit, fetchPage]);

  // Manuel yenile
  const refresh = useCallback(() => {
    setOffset(0);
    fetchPage(0, false);
  }, [fetchPage]);

  return {
    results,
    total,
    isLoading,
    error,
    hasMore: results.length < total,
    loadMore,
    refresh,
  };
}
