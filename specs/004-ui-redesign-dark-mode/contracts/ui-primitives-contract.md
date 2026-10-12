# Contract: Primitivos UI (Button, CategorySelector, accesibilidad)

**Feature**: `004-ui-redesign-dark-mode`
**Módulos**: `src/components/ui/Button.tsx`, `src/components/ui/cn.ts`,
`src/components/CategorySelector.tsx`
**Capa**: presentación (Artículo VII: sin lógica de negocio).

## 1. `cn` — utilidad de clases

```ts
// src/components/ui/cn.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]): string;
```

Composición estándar `twMerge(clsx(inputs))`; sin lógica adicional.

## 2. `Button` — variantes estilo shadcn/ui

```ts
// src/components/ui/Button.tsx
import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants: VariantProps<typeof buttonVariantsCva>; // documentado abajo

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariantsCva> {}

export const Button: React.ForwardRefExoticComponent<ButtonProps>;
```

### Variantes (cva)

| Variante | Clases base (además de las comunes) | Uso |
|---|---|---|
| `default` | `bg-foreground text-background hover:opacity-90` | "Registrar" |
| `outline` | `border border-border bg-card text-foreground hover:bg-muted` | DayNav, pestañas |
| `ghost` | `text-foreground hover:bg-muted` | acciones secundarias |
| `icon` | `inline-flex items-center justify-center size-9` (+ base ghost visual) | sol/luna, exportar, importar |

Comunes a todas: `inline-flex items-center justify-center gap-2 rounded-xl
text-sm font-medium transition-colors focus-visible:outline-none
focus-visible:ring-2 focus-visible:ring-foreground/40
disabled:pointer-events-none disabled:opacity-50`. `type` por defecto
`"button"` (los submits explícitos pasan `type="submit"`).

**Sin Radix, sin `asChild`** (Artículo VII). Los iconos se pasan como
hijos (`<Button variant="icon" aria-label="…"><Moon size={16} /></Button>`).

### Pruebas de componente

- Renderiza una variante con sus clases (query por `getByRole('button')`).
- `icon` exige `aria-label` (test: falta → se marca en review de a11y; la
  regla se valida en los tests de `ThemeToggle`/`DataTransferButtons`).

## 3. `CategorySelector` — radiogroup segmentado

```ts
// src/components/CategorySelector.tsx
import type { Category } from '../core/types';

export interface CategorySelectorProps {
  value: Category | null;
  onChange: (category: Category) => void;
}
```

### Semántica y estética (FR-003, FR-005, FR-011)

- Contenedor: `role="radiogroup"` con `aria-label="Categoría"`;
  estética: `bg-muted border border-border p-1 rounded-xl inline-flex`.
- Cada opción: `<button role="radio" aria-checked={selected}>` con label
  `CATEGORY_LABELS` ("Trabajo" | "Aprendizaje").
- Seleccionada: relleno con el token de su categoría
  (`bg-work text-background` / `bg-learning text-background`).
- No seleccionada: `text-muted-foreground hover:bg-card`.
- Navegación por flechas del teclado **no es obligatoria** (radio buttons
  nativos con tab son aceptables para 2 opciones); el tab order debe
  recorrer ambas opciones.
- Al cambiar, emite `onChange` inmediatamente (el padre limpia errores).

### Pruebas de componente (RTL, por roles)

| Escenario | Esperado |
|---|---|
| `value='WORK'` | `getByRole('radio', { name: 'Trabajo' })` con `aria-checked=true` |
| click "Aprendizaje" | `onChange` llamado con `'LEARNING'` |
| `value=null` | ninguna opción `aria-checked` |

## 4. Acuerdos de accesibilidad transversales (FR-011)

| Componente | Requisito |
|---|---|
| `ThemeToggle` | `aria-label` dinámico (ver theme-contract §4) |
| `BalanceMeter` | `role="meter"`, `aria-valuemin=0`, `aria-valuemax=100`, `aria-valuenow=learningPercent`, `aria-label="Balance del día"` |
| `QuickEntryBar` | validación inline en `<p role="alert">`; toasts en `<p role="status">`; placeholder "¿En qué invertiste tu tiempo?"; label `sr-only` cuando el placeholder ya comunica |
| `WeeklyTrends` | pestañas: `role="tablist"` + botones `role="tab"` + `aria-selected`; panel `role="tabpanel"` |
| `DayNav` | `aria-label` por botón: "Día anterior", "Ir a hoy", "Día siguiente" |
| Foco | todos los controles con `focus-visible:ring-2` (clase en Button y en controles custom) |

## 5. Fuera de contrato

- Nombres de tokens de color (definidos en el plan/research R1).
- Copy de veredictos (balance-verdict-contract).
- Comportamiento de guardado/eliminación (contratos de features 001/003).
