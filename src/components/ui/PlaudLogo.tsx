'use client';

/**
 * Logo Plaud en SVG inline pour contrôler la couleur via currentColor.
 * Utilise `className` pour la taille (ex: w-4 h-4) et la couleur hérite du parent (text-xxx).
 */
export function PlaudLogo({
  className = 'w-4 h-4',
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 177.9 150.3"
      fill="currentColor"
      className={className}
      aria-label="Plaud"
    >
      <path d="M105.6,27.5c3.2,0,6,3.1,6.8,5.8l35,117,30.4-.2-36.7-114.5C132.5,13.6,111.5-.2,88.4,0c-22.7.2-43.4,14.1-51.8,35.8L0,150.1l30.3.2,34.9-116.9c1.1-3.5,4-6,7.6-6h32.8ZM85.9,67.4c-11.3,1.8-17.9,12.5-16.2,22.2s11.8,17.9,22.5,16.2,17.4-11.4,16-21.6c-1.4-10.5-11-18.6-22.3-16.8Z"/>
    </svg>
  );
}
