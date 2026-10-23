"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { MediaView } from "@/server/queries/projects";

// Signed Storage links change on every render, so the images skip next/image: its optimizer
// would cache each signed URL as a new image.
/* eslint-disable @next/next/no-img-element */

/** The lightbox's buttons, on its dark backdrop in both themes. */
const ON_DARK = "bg-branco text-grafite hover:bg-nevoa";

/** An update's prints: thumbnails that open a lightbox (native <dialog>, arrow keys to browse). */
export function MediaGallery({ images, title }: { images: MediaView[]; title: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const image = images[index] ?? images[0];
  const step = (delta: number) => setIndex((i) => (i + delta + images.length) % images.length);
  const label = (i: number) =>
    images.length > 1 ? `${title}, imagem ${i + 1} de ${images.length}` : title;

  if (!image) return null;

  return (
    <div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((media, i) => (
          <li key={media.id}>
            <button
              type="button"
              aria-label={`Ampliar: ${label(i)}`}
              className="block aspect-4/3 w-full cursor-zoom-in overflow-hidden rounded-sm border border-border bg-surface-alt"
              onClick={() => {
                setIndex(i);
                dialog.current?.showModal();
              }}
            >
              <img
                src={media.url}
                alt=""
                width={media.width ?? undefined}
                height={media.height ?? undefined}
                loading="lazy"
                className="size-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>
      <dialog
        ref={dialog}
        aria-label={`Imagem ampliada: ${title}`}
        // always dark behind the image, in both themes: fixed palette colors, not the inverting tokens
        className="m-auto max-h-dvh w-full max-w-5xl bg-transparent p-4 [--focus:var(--branco)] backdrop:bg-grafite/90"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") step(1);
          if (event.key === "ArrowLeft") step(-1);
        }}
      >
        <figure className="flex flex-col gap-3">
          <img
            src={image.url}
            alt={label(index)}
            width={image.width ?? undefined}
            height={image.height ?? undefined}
            className="max-h-[80dvh] w-full rounded-sm bg-surface object-contain"
          />
          <figcaption className="flex flex-wrap items-center justify-between gap-2">
            <span className="type-small text-branco" aria-live="polite">
              {images.length > 1 ? `${index + 1} de ${images.length}` : title}
            </span>
            <span className="flex gap-2">
              {images.length > 1 && (
                <>
                  <Button variant="inverse" size="sm" className={ON_DARK} onClick={() => step(-1)}>
                    Anterior
                  </Button>
                  <Button variant="inverse" size="sm" className={ON_DARK} onClick={() => step(1)}>
                    Próxima
                  </Button>
                </>
              )}
              <Button
                variant="inverse"
                size="sm"
                className={ON_DARK}
                onClick={() => dialog.current?.close()}
                autoFocus
              >
                Fechar
              </Button>
            </span>
          </figcaption>
        </figure>
      </dialog>
    </div>
  );
}
