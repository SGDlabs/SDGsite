import { About } from "@/components/marketing/about";
import { Contact } from "@/components/marketing/contact";
import { Faq } from "@/components/marketing/faq";
import { Hero } from "@/components/marketing/hero";
import { LandingChrome, LandingPage } from "@/components/marketing/landing-page";
import { Manifesto } from "@/components/marketing/manifesto";
import { Marquee } from "@/components/marketing/marquee";
import { Portfolio } from "@/components/marketing/portfolio";
import { Process } from "@/components/marketing/process";
import { Services } from "@/components/marketing/services";
import { Showcase } from "@/components/marketing/showcase";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";
import { site, siteUrl } from "@/lib/site";

/** Who we are, for search engines (schema.org Organization). */
const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  slogan: site.slogan,
  description: site.description,
  url: siteUrl.href,
  logo: new URL("/brand/sdglabs-vertical-light.svg", siteUrl).href,
  areaServed: "BR",
  knowsLanguage: "pt-BR",
};

export default function HomePage() {
  return (
    <LandingPage>
      <script
        type="application/ld+json"
        // JSON.stringify does not escape "<": done here so no string can close the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, "\\u003c") }}
      />
      <LandingChrome />
      <SiteNav onHome />
      <main>
        <Hero />
        <Marquee />
        <Services />
        <Process />
        <Showcase />
        <Portfolio />
        <Manifesto />
        <About />
        <Faq />
        <Contact />
      </main>
      <SiteFooter onHome />
    </LandingPage>
  );
}
