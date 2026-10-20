"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { PortfolioImage } from "@/types/portfolio";

/** Case study gallery: thumbnails that open a lightbox (native <dialog>, arrow keys to browse). */
export function Gallery({
  images,
  pixelArt = false,
}: {
  images: PortfolioImage[];
  pixelArt?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const image = images[index] ?? images[0]!;
  const step = (delta: number) => setIndex((i) => (i + delta + images.length) % images.length);
  const pixel = pixelArt && "pixelated";

  return (
    <section className="pf-gallery-wrap" aria-label="Galeria">
      <ul className="pf-gallery">
        {images.map((img, i) => (
          <li key={img.src}>
            <button
              type="button"
              className="pf-thumb"
              aria-label={`Ampliar: ${img.alt}`}
              onClick={() => {
                setIndex(i);
                dialog.current?.showModal();
              }}
            >
              <Image
                src={img.src}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className={cn("pf-img", pixel)}
                unoptimized={pixelArt}
              />
            </button>
          </li>
        ))}
      </ul>
      {/* data-lenis-prevent: the wheel scrolls inside the dialog, not the page behind it */}
      <dialog
        ref={dialog}
        className="pf-lightbox"
        aria-label="Imagem ampliada"
        data-lenis-prevent
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") step(1);
          if (event.key === "ArrowLeft") step(-1);
        }}
      >
        <Image
          src={image.src}
          alt={image.alt}
          width={1280}
          height={960}
          className={cn("pf-lb-img", pixel)}
          unoptimized={pixelArt}
        />
        <div className="pf-lb-bar">
          <button type="button" onClick={() => step(-1)}>
            Anterior
          </button>
          <span aria-live="polite">
            {index + 1} / {images.length}
          </span>
          <button type="button" onClick={() => step(1)}>
            Próxima
          </button>
          <button type="button" onClick={() => dialog.current?.close()} autoFocus>
            Fechar
          </button>
        </div>
      </dialog>
    </section>
  );
}
