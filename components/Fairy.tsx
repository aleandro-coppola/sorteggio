"use client";

// La Fata Verde: attraversa lo schermo quando viene liberata. 🧚
export default function Fairy({ onDone }: { onDone: () => void }) {
  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[10000] animate-fairy-fly text-6xl"
      onAnimationEnd={onDone}
      aria-hidden
    >
      <span className="relative inline-block">
        🧚
        <span className="absolute -left-6 top-2 animate-ping text-2xl">✨</span>
        <span className="absolute -right-4 -top-3 animate-pulse text-xl">
          💚
        </span>
        <span className="absolute -bottom-4 left-1 animate-bounce text-lg">
          ✨
        </span>
      </span>
    </div>
  );
}
