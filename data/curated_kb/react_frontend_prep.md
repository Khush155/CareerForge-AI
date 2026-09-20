# Modern React & Frontend Architecture

## Summary
Modern frontend engineering centers on declarative UI, unidirectional data flow, concurrent rendering, and accessible interactive components using React 19, TypeScript, and modern state architectures.

## Key Concepts
- **React 19 & Component Lifecycle**: Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useTransition`, `useDeferredValue`), Concurrent Rendering, Server Components vs Client Components.
- **State Management**: Local state vs global stores (Zustand, Redux Toolkit), atomic state, and URL search param state synchronization.
- **Web Performance**: Core Web Vitals (LCP, INP, CLS), dynamic imports (`React.lazy`), code-splitting, memoization, and DOM virtualization.
- **Accessibility & Design Tokens**: Semantic HTML, ARIA live regions, keyboard navigation (Tab/Shift-Tab/Escape), WCAG AA contrast ratios, and CSS variables.

## Worked Example: Debounced Search with Transition
```tsx
import React, { useState, useTransition } from 'react';

export function SearchBox({ onSearch }: { onSearch: (query: string) => void }) {
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    startTransition(() => {
      onSearch(val);
    });
  };

  return (
    <div className="search-container">
      <input value={input} onChange={handleChange} placeholder="Search skills..." />
      {isPending && <span aria-live="polite">Updating results...</span>}
    </div>
  );
}
```

## Common Interview Questions
1. *When should you use `useCallback` vs `useMemo`?* (`useCallback` memoizes the function reference; `useMemo` memoizes the computed return value).
2. *What causes unintended re-renders in React and how do you diagnose them?* (Parent re-renders, unstable object/array prop references, context value updates without selector memoization).
3. *Explain the difference between controlled and uncontrolled components.* (Controlled components have their form state driven by React state; uncontrolled components maintain internal DOM state accessed via `ref`).

## Documentation & Official Resources
- [React Official Documentation](https://react.dev/)
- [Web.dev Core Web Vitals](https://web.dev/vitals/)
