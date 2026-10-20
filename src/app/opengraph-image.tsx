import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { registerSiteTheme } from "@/components/marketing/brand";
import SDGLogo from "@/lib/brand/sdg-logo";
import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.slogan}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

registerSiteTheme(SDGLogo);

// The vertical logo, drawn by the same engine as the animation, as a crisp SVG.
const logoSvg = SDGLogo.toSVG(SDGLogo.verticalCells("site"), { margin: 0, unit: 1 });
const [, , logoW, logoH] = /viewBox="([\d ]+)"/.exec(logoSvg)![1]!.split(" ").map(Number);
const LOGO_SCALE = 7;

// Bricolage Grotesque 700 at 78% width (the hero's title), subset to the characters used here.
const font = readFile(join(process.cwd(), "src/app/fonts/bricolage-og.ttf"));

export default async function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 80,
        padding: "0 96px",
        background: "#1C1F20",
        color: "#F4F6F6",
        fontFamily: "Bricolage",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img */}
      <img
        src={`data:image/svg+xml;base64,${Buffer.from(logoSvg).toString("base64")}`}
        width={logoW! * LOGO_SCALE}
        height={logoH! * LOGO_SCALE}
        alt=""
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 28, width: 560 }}>
        <div style={{ fontSize: 96, lineHeight: 0.92, letterSpacing: "-0.03em" }}>
          {site.slogan}
        </div>
        <div style={{ fontSize: 32, color: "#AEB5B6" }}>
          Sites, aplicativos e sistemas sob medida.
        </div>
      </div>
    </div>,
    { ...size, fonts: [{ name: "Bricolage", data: await font, weight: 700, style: "normal" }] },
  );
}
