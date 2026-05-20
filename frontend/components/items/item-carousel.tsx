"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ItemCard } from "@/components/items/item-card";
import type { Item } from "@/lib/types";

function getCardsPerView(width: number) {
  if (width >= 1024) {
    return 3;
  }

  if (width >= 640) {
    return 2;
  }

  return 1;
}

export function ItemCarousel({ items, onDetails }: { items: Item[]; onDetails: (item: Item) => void }) {
  const [index, setIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    function updateCardsPerView() {
      setCardsPerView(getCardsPerView(window.innerWidth));
    }

    updateCardsPerView();
    window.addEventListener("resize", updateCardsPerView);
    return () => window.removeEventListener("resize", updateCardsPerView);
  }, []);

  const maxIndex = useMemo(() => Math.max(items.length - cardsPerView, 0), [items.length, cardsPerView]);

  useEffect(() => {
    setIndex((currentIndex) => Math.min(currentIndex, maxIndex));
  }, [maxIndex]);

  function previous() {
    setIndex((currentIndex) => Math.max(currentIndex - 1, 0));
  }

  function next() {
    setIndex((currentIndex) => Math.min(currentIndex + 1, maxIndex));
  }

  function handleTouchEnd(clientX: number) {
    if (touchStart === null) {
      return;
    }

    const distance = touchStart - clientX;

    if (Math.abs(distance) > 42) {
      if (distance > 0) {
        next();
      } else {
        previous();
      }
    }

    setTouchStart(null);
  }

  return (
    <section aria-label="Carrossel de itens" className="relative">
      <div
        className="overflow-hidden"
        onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
        onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0].clientX)}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * (100 / cardsPerView)}%)` }}
        >
          {items.map((item) => (
            <div key={item.id} className="min-w-0 px-2 py-2" style={{ flex: `0 0 ${100 / cardsPerView}%` }}>
              <ItemCard item={item} onDetails={onDetails} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button type="button" className="sigap-secondary h-10 w-10 px-0" onClick={previous} disabled={index === 0}>
          <ChevronLeft size={18} />
          <span className="sr-only">Anterior</span>
        </button>

        <div className="flex items-center gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              onClick={() => setIndex(dotIndex)}
              className={`h-2.5 rounded-full transition-all ${
                dotIndex === index ? "w-7 bg-blue-700 dark:bg-blue-400" : "w-2.5 bg-slate-300 dark:bg-slate-700"
              }`}
              aria-label={`Ir para posicao ${dotIndex + 1}`}
            />
          ))}
        </div>

        <button type="button" className="sigap-secondary h-10 w-10 px-0" onClick={next} disabled={index === maxIndex}>
          <ChevronRight size={18} />
          <span className="sr-only">Proximo</span>
        </button>
      </div>
    </section>
  );
}
