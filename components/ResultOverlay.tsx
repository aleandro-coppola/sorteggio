"use client";

type ResultOverlayProps = {
  title: string;
  name: string;
  phrase: string;
  miracolo?: string | null;
  tone: "gloria" | "sfotto";
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
};

export default function ResultOverlay({
  title,
  name,
  phrase,
  miracolo,
  tone,
  onClose,
  actionLabel,
  onAction,
}: ResultOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-abisso/85 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="etichetta w-full max-w-md animate-pop-in rounded-sm p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-[family-name:var(--font-titolo)] text-sm tracking-[0.35em] text-ottone-chiaro">
          ✦ {title} ✦
        </p>
        <div className="divisorio-oro my-4" />
        <p
          className={`break-words font-[family-name:var(--font-titolo)] text-4xl font-bold sm:text-5xl ${
            tone === "gloria" ? "testo-oro" : "text-assenzio"
          }`}
        >
          {name}
        </p>
        <p className="mt-5 text-xl italic leading-relaxed text-etichetta">
          {phrase}
        </p>
        {miracolo && (
          <p className="mt-4 animate-pulse rounded-sm border border-ottone/60 bg-abisso/60 p-3 text-lg font-semibold text-ottone-chiaro">
            {miracolo}
          </p>
        )}
        <div className="divisorio-oro my-5" />
        <div className="flex justify-center gap-3">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="rounded-sm border border-assenzio/70 bg-smeraldo/40 px-5 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-widest text-assenzio-pallido transition-all hover:scale-105 hover:bg-smeraldo/70"
            >
              {actionLabel}
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-sm border border-ottone/60 px-5 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-widest text-ottone-chiaro transition-all hover:scale-105 hover:bg-ottone/15"
          >
            CHIUDI
          </button>
        </div>
      </div>
    </div>
  );
}
