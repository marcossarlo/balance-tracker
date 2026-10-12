# Contract: Tema claro/oscuro (core + hook)

**Feature**: `004-ui-redesign-dark-mode`
**Módulos**: `src/core/theme.ts` (puro, Artículo I) +
`src/hooks/useTheme.ts` (integración) + script anti-FOUC en `index.html`.

## Propósito

Resolver, persistir y aplicar la preferencia de tema con cambio instantáneo
y sin parpadeo inicial (US5, FR-008, SC-001).

## 1. Core puro — `src/core/theme.ts`

```ts
export type Theme = 'light' | 'dark';
export type StoredTheme = Theme | null;

export const THEME_STORAGE_KEY = 'bt:theme';

export function resolveInitialTheme(stored: StoredTheme, prefersDark: boolean): Theme;
export function toggleTheme(theme: Theme): Theme;
```

### Reglas

| Función | Regla |
|---|---|
| `resolveInitialTheme` | `stored !== null ? stored : (prefersDark ? 'dark' : 'light')` |
| `toggleTheme` | `'light' → 'dark'`, `'dark' → 'light'` |

### Casos de prueba (TDD rojo→verde)

| `stored` | `prefersDark` | Resultado |
|---|---|---|
| `'dark'` | `false` | `'dark'` |
| `'light'` | `true` | `'light'` |
| `null` | `true` | `'dark'` |
| `null` | `false` | `'light'` |
| `toggleTheme('light')` | — | `'dark'` |
| `toggleTheme('dark')` | — | `'light'` |

## 2. Hook — `src/hooks/useTheme.ts`

```ts
export interface UseTheme {
  theme: Theme;
  toggle: () => void;
}

export function useTheme(): UseTheme;
```

### Efectos garantizados (comportamiento, no forma del estado interno)

1. Al montar: `theme = resolveInitialTheme(localStorage[KEY] ?? null, matchMedia('(prefers-color-scheme: dark)').matches)`.
2. Al montar y en cada cambio de `theme`:
   - `document.documentElement.classList.toggle('dark', theme === 'dark')`;
   - `localStorage.setItem('bt:theme', theme)`.
3. `toggle()` aplica `toggleTheme` y dispara (2).
4. Sin errores al `localStorage` estar bloqueado (fallback: mantener el
   tema en memoria, no romper la UI).
5. Sin suscripción obligatoria a `matchMedia` en runtime: la preferencia
   guardada tiene prioridad permanente una vez elegida (SC-001).

## 3. Anti-FOUC — `index.html` (script inline, antes de `#root`)

```html
<script>
  (function () {
    try {
      var stored = localStorage.getItem('bt:theme');
      var dark = stored ? stored === 'dark'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (dark) document.documentElement.classList.add('dark');
    } catch (e) { /* localStorage bloqueado: tema claro por defecto */ }
  })();
</script>
```

Misma clave y misma regla que el core (una sola fuente de verdad de la
regla: la lógica duplicada es mínima e idéntica a propósito — el script
no puede importar módulos antes del bundling).

## 4. Invariantes de UI

- El cambio de tema **nunca** reconsulta Dexie ni altera estado de datos.
- Todos los componentes leen colores vía tokens (`bg-card`, `text-work`,
  …); ningún componente contiene hex literales (FR-002/FR-014).
- `ThemeToggle` expone `aria-label` dinámico: `Cambiar a modo oscuro` /
  `Cambiar a modo claro`, con icono `Sun`/`Moon` de lucide-react.
