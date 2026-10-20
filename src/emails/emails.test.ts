import { render } from "@react-email/render";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { LeadReceivedEmail, leadReceivedSubject } from "./lead-received";
import { NewUpdatesEmail, newUpdatesSubject } from "./new-updates";
import { StageCompletedEmail, stageCompletedSubject } from "./stage-completed";

const stage = {
  name: "Maria",
  projectName: "App de agendamento",
  completed: { position: 2, title: "Design" },
  next: { position: 3, title: "Desenvolvimento" },
  total: 5,
  url: "https://sdglabs.test/painel/projetos/1",
};

describe("stage completed", () => {
  it("says what ended, what starts and links to the project", async () => {
    const html = await render(createElement(StageCompletedEmail, stage));
    expect(stageCompletedSubject(stage)).toBe("App de agendamento: etapa 3 começou");
    expect(html).toContain("Etapa 2 de 5 concluída");
    expect(html).toContain("Olá, Maria.");
    expect(html).toContain("Desenvolvimento");
    expect(html).toContain('href="https://sdglabs.test/painel/projetos/1"');
    expect(html).toMatch(/^<!DOCTYPE html/i);
  });

  it("celebrates the end when there is no next stage", async () => {
    const done = {
      ...stage,
      completed: { position: 5, title: "Entrega e publicação" },
      next: null,
    };
    const text = await render(createElement(StageCompletedEmail, done), { plainText: true });
    expect(stageCompletedSubject(done)).toBe("App de agendamento: projeto concluído");
    expect(text).toContain("seu projeto está pronto");
  });
});

describe("new updates", () => {
  const news = {
    name: null,
    projectName: "App de agendamento",
    updates: [
      { kind: "Prints", title: "Telas novas", when: "18 de out. de 2026, 14:30" },
      { kind: "Deploy", title: "Deploy: home", when: "18 de out. de 2026, 15:00" },
    ],
    url: "https://sdglabs.test/painel/projetos/1",
    preferencesUrl: "https://sdglabs.test/painel/conta",
  };

  it("groups the news and says how to stop them", async () => {
    const html = await render(createElement(NewUpdatesEmail, news));
    expect(newUpdatesSubject(news)).toBe("App de agendamento: 2 novidades");
    expect(html).toContain("Telas novas");
    expect(html).toContain("Deploy: home");
    expect(html).toContain('href="https://sdglabs.test/painel/conta"');
    expect(newUpdatesSubject({ ...news, updates: news.updates.slice(0, 1) })).toBe(
      "App de agendamento: Telas novas",
    );
  });
});

describe("lead received", () => {
  it("has what the partners need to answer", async () => {
    const lead = {
      name: "Maria",
      email: "maria@empresa.com.br",
      company: "Empresa",
      interest: ["Site", "Aplicativo"],
      message: "Quero um app.",
      url: "https://sdglabs.test/admin/leads?status=novo",
    };
    const html = await render(createElement(LeadReceivedEmail, lead));
    expect(leadReceivedSubject(lead)).toBe("Novo lead: Maria (Empresa)");
    expect(html).toContain('href="mailto:maria@empresa.com.br"');
    expect(html).toContain("Site, Aplicativo");
    expect(html).toContain("Quero um app.");
  });
});
