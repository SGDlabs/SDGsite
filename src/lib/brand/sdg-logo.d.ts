// Types for sdg-logo.js, the logo engine copied from the SDG Labs design system (Codigo asset group).

declare namespace SDGLogo {
  /** "light" and "dark" ship with the engine; pages may register more in THEMES. */
  type Theme = "light" | "dark" | (string & {});

  interface Cell {
    x: number;
    y: number;
    c: string;
  }

  interface MountOptions {
    theme?: Theme;
    /** false leaves the canvas transparent so it shows the section's background. */
    background?: boolean;
    loop?: boolean;
  }

  interface Player {
    /** Plays once (~5s) and stops on the horizontal logo; with prefers-reduced-motion, draws the final frame. */
    play(): void;
    setTheme(theme: Theme): void;
    setLoop(loop: boolean): void;
    /** Draws the frame at time t, in ms. */
    drawAt(t: number): void;
  }

  interface SVGOptions {
    margin?: number;
    unit?: number;
    title?: string;
    bg?: string;
  }
}

declare const SDGLogo: {
  THEMES: Record<SDGLogo.Theme, Record<string, string>>;
  T_END: number;
  VW: number;
  VH: number;
  mount(canvas: HTMLCanvasElement, options?: SDGLogo.MountOptions): SDGLogo.Player;
  toSVG(cells: SDGLogo.Cell[], options?: SDGLogo.SVGOptions): string;
  iconCells(theme?: SDGLogo.Theme, withBubbles?: boolean): SDGLogo.Cell[];
  verticalCells(theme?: SDGLogo.Theme): SDGLogo.Cell[];
  horizontalCells(theme?: SDGLogo.Theme): SDGLogo.Cell[];
  wordCells(theme: SDGLogo.Theme, x0: number, y0: number): SDGLogo.Cell[];
};

export = SDGLogo;
