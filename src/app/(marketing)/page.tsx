import { About } from "@/components/marketing/about";
import { ContactCta } from "@/components/marketing/contact-cta";
import { Hero } from "@/components/marketing/hero";
import { Process } from "@/components/marketing/process";
import { Services } from "@/components/marketing/services";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <Process />
      <About />
      <ContactCta />
    </>
  );
}
