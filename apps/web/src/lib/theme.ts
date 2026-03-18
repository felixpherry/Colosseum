// 1. getTheme(): "light" | "dark"
//    - Read from localStorage key "colosseum-theme"
//    - If not set, check system preference using window.matchMedia("(prefers-color-scheme: dark)")
//    - Return "light" or "dark"
//

export function getTheme() {
  const theme =
    (localStorage.getItem('colosseum-theme') ??
    window.matchMedia('(prefers-color-scheme: dark)'))
      ? 'dark'
      : 'light';
  return theme;
}

// 2. setTheme(theme: "light" | "dark"): void
//    - Save to localStorage
//    - Add or remove "dark" class on document.documentElement
