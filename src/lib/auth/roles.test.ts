import { describe, expect, it } from "vitest";
import { initials } from "@/lib/initials";
import { redirectFor, requiredRole } from "./access";
import { hasRole, homeFor, roleFromClaims, safeNext } from "./roles";

describe("roleFromClaims", () => {
  it("reads the role from app_metadata only", () => {
    expect(roleFromClaims({ app_metadata: { role: "admin" } })).toBe("admin");
    expect(roleFromClaims({ app_metadata: { role: "client" } })).toBe("client");
  });

  it("treats anything else as a client", () => {
    expect(roleFromClaims({ app_metadata: {} })).toBe("client");
    expect(roleFromClaims({ app_metadata: { role: "ADMIN" } })).toBe("client");
    expect(roleFromClaims(null)).toBe("client");
    // user_metadata is editable by the user and must never grant access
    expect(roleFromClaims({ user_metadata: { role: "admin" } } as never)).toBe("client");
  });
});

describe("homeFor and hasRole", () => {
  it("sends each role to its area", () => {
    expect(homeFor("admin")).toBe("/admin");
    expect(homeFor("client")).toBe("/painel");
  });

  it("lets admins into the client area, never the other way round", () => {
    expect(hasRole("admin", "client")).toBe(true);
    expect(hasRole("client", "admin")).toBe(false);
  });
});

describe("safeNext", () => {
  it("keeps paths inside the site", () => {
    expect(safeNext("/painel/projetos/1?aba=feed")).toBe("/painel/projetos/1?aba=feed");
  });

  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "painel", "", null, 42])(
    "rejects %s",
    (value) => {
      expect(safeNext(value)).toBeNull();
    },
  );
});

describe("redirectFor", () => {
  it("sends visitors to /login and remembers where they were going", () => {
    expect(redirectFor("/painel/projetos/1", "?aba=feed", null)).toBe(
      "/login?next=%2Fpainel%2Fprojetos%2F1%3Faba%3Dfeed",
    );
    expect(redirectFor("/admin", "", null)).toBe("/login?next=%2Fadmin");
  });

  it("keeps clients out of the admin", () => {
    expect(redirectFor("/admin/clientes", "", "client")).toBe("/painel");
    expect(redirectFor("/admin", "", "admin")).toBeNull();
  });

  it("lets admins see the client area", () => {
    expect(redirectFor("/painel", "", "admin")).toBeNull();
  });

  it("takes signed-in users from /login to their area", () => {
    expect(redirectFor("/login", "", "admin")).toBe("/admin");
    expect(redirectFor("/login", "", "client")).toBe("/painel");
    expect(redirectFor("/login", "", null)).toBeNull();
  });

  it("leaves the invitation and new password pages to signed-in users", () => {
    expect(redirectFor("/convite", "", "client")).toBeNull();
    expect(redirectFor("/redefinir-senha", "", "client")).toBeNull();
  });

  it("does not mistake look-alike paths for an area", () => {
    expect(requiredRole("/administracao")).toBeNull();
    expect(requiredRole("/painel-de-controle")).toBeNull();
  });
});

describe("initials", () => {
  it("takes the first and last names, or the start of the e-mail", () => {
    expect(initials("Maria da Silva Souza")).toBe("MS");
    expect(initials("ana")).toBe("A");
    expect(initials("joao.pereira@empresa.com.br")).toBe("JP");
    expect(initials("élia")).toBe("É");
  });
});
