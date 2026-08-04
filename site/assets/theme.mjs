export function initThemeToggle(button) {
  if (!button) return;
  button.addEventListener("click", () => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const effective = root.getAttribute("data-theme") || (prefersDark ? "dark" : "light");
    const next = effective === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {
      // localStorage unavailable (private browsing, etc.) — theme just won't persist.
    }
  });
}
