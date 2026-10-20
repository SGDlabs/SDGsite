import SDGLogo from "@/lib/brand/sdg-logo";
import { registerSiteTheme } from "./brand";

registerSiteTheme(SDGLogo);

/** Renders engine cells as a crisp SVG, one path per color (same output as SDGLogo.toSVG). */
function PixelSvg({ cells, className }: { cells: SDGLogo.Cell[]; className: string }) {
  const x0 = Math.min(...cells.map((cell) => cell.x));
  const y0 = Math.min(...cells.map((cell) => cell.y));
  const width = Math.max(...cells.map((cell) => cell.x)) - x0 + 1;
  const height = Math.max(...cells.map((cell) => cell.y)) - y0 + 1;
  const paths = new Map<string, string>();
  for (const cell of cells) {
    paths.set(cell.c, `${paths.get(cell.c) ?? ""}M${cell.x - x0} ${cell.y - y0}h1v1h-1z`);
  }

  return (
    <svg
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      shapeRendering="crispEdges"
    >
      {[...paths].map(([fill, d]) => (
        <path key={fill} fill={fill} d={d} />
      ))}
    </svg>
  );
}

/** Standing flask beside the SDG LABS wordmark (nav). */
export function NavLogo() {
  return (
    <PixelSvg
      className="logo-svg"
      cells={SDGLogo.iconCells("site").concat(SDGLogo.wordCells("site", 30, 9))}
    />
  );
}

/** The flask alone (client panel sidebar). */
export function PanelIcon() {
  return <PixelSvg className="ico-svg" cells={SDGLogo.iconCells("site")} />;
}
