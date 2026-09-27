// Outside Vite (node --test with renderToStaticMarkup) import.meta.env is undefined: fall back to the root.
export const brand = (name:string) => `${import.meta.env?.BASE_URL ?? '/'}brand/${name}`;
