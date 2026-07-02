"use client";

import { useState } from "react";
import { shuffle } from "@/lib/phrases";

export default function Ordine({ players }: { players: string[] }) {
  const [order, setOrder] = useState<string[]>([]);

  const tira = () => setOrder(shuffle(players));

  const MEDAGLIE = ["👑", "🥈", "🥉"];

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-center text-lg italic text-etichetta-scura">
        Chi accumencia? &rsquo;A sorte decide &rsquo;o giro: perfetto pe&rsquo;
        giochi &rsquo;a tavola e pe&rsquo; evità appicceche. 🎲
      </p>

      <button
        onClick={tira}
        className="etichetta rounded-sm px-10 py-3 font-[family-name:var(--font-titolo)] text-xl tracking-[0.2em] text-etichetta transition-all hover:scale-105 hover:brightness-125 active:scale-95"
      >
        {order.length > 0 ? "↺ N'ATA VOTA" : "TIRA 'E SORTI"}
      </button>

      {order.length > 0 && (
        <ol className="w-full max-w-md space-y-2">
          {order.map((name, i) => (
            <li
              key={name}
              className={`etichetta flex animate-pop-in items-center gap-4 rounded-sm px-5 py-3 ${
                i === 0 ? "shadow-[0_0_18px_rgba(201,162,39,0.35)]" : ""
              }`}
              style={{ animationDelay: `${i * 0.25}s`, opacity: 0 }}
            >
              <span className="font-[family-name:var(--font-titolo)] text-2xl text-ottone-chiaro">
                {MEDAGLIE[i] ?? `${i + 1}°`}
              </span>
              <span
                className={`text-xl ${
                  i === 0 ? "testo-oro font-bold" : "text-etichetta"
                }`}
              >
                {name}
              </span>
              {i === 0 && (
                <span className="ml-auto text-sm italic text-etichetta-scura">
                  accumencia isso!
                </span>
              )}
              {i === order.length - 1 && order.length > 2 && (
                <span className="ml-auto text-sm italic text-etichetta-scura">
                  urdemo… comme sempe 💀
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
