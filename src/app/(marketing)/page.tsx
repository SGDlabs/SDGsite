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

export default function HomePage() {
  return (
    <LandingPage>
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
