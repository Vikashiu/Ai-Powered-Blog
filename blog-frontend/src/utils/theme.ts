export function initThemeFromStorage() {
  const stored = localStorage.getItem("nexis_theme") as "light" | "dark" | null;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const theme = stored ?? (prefersDark ? "dark" : "light");
  document.documentElement.classList.toggle("dark", theme === "dark");

  return theme;
}
