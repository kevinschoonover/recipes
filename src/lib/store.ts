import { Store } from "@tanstack/store";

export const appStore = new Store({
  sidebarCollapsed: false,
  chatOpen: false,
  searchQuery: "",
  selectedCategory: null as string | null,
});
