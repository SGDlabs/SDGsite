import { About } from "@/components/marketing/about";
import { Contact } from "@/components/marketing/contact";
import { Faq } from "@/components/marketing/faq";
import { Hero } from "@/components/marketing/hero";
import { LandingEffects } from "@/components/marketing/landing-effects";
import { Manifesto } from "@/components/marketing/manifesto";
import { Marquee } from "@/components/marketing/marquee";
import { Portfolio } from "@/components/marketing/portfolio";
import { Process } from "@/components/marketing/process";
import { Services } from "@/components/marketing/services";
import { Showcase } from "@/components/marketing/showcase";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";

export default function HomePage() {
  return (
    <>
      <div className="grain" aria-hidden="true"></div>
      <div className="cursor" id="cursor" aria-hidden="true"></div>
      <div className="tube" id="tube" aria-hidden="true">
        <i></i>
        <b></b>
      </div>
      <SiteNav />
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
      <SiteFooter />
      <LandingEffects />
    </>
  );
}
