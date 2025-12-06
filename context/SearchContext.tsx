"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { PRESET_CATEGORIES } from "@/types/firestore"; 
// Make sure this exports your list

interface SearchContextType {
  searchText: string;
  setSearchText: (value: string) => void;

  selectedCategory: string | null;
  setSelectedCategory: (value: string | null) => void;

  categories: { id: string; name: string }[];
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <SearchContext.Provider
      value={{
        searchText,
        setSearchText,

        selectedCategory,
        setSelectedCategory,

        categories: PRESET_CATEGORIES,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used inside SearchProvider");
  return ctx;
}
