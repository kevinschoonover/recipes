"use client";

import {
  createContext,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

interface SearchContextType {
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
}

export const SearchContext = createContext<SearchContextType>({
  setSearchText: () => {
    return [];
  },
  searchText: "",
});

export default function SearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchText, setSearchText] = useState<string>("");

  return (
    <SearchContext.Provider
      value={{
        searchText,
        setSearchText,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}
