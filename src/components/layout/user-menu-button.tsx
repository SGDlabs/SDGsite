"use client";

import Link from "next/link";
import { useSyncExternalStore, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { applyTheme, readTheme, subscribeTheme, THEMES, type ThemeChoice } from "@/lib/theme";
import { signOut } from "@/server/actions/auth";

const THEME_LABELS: Record<ThemeChoice, string> = {
  system: "Igual ao aparelho",
  light: "Claro",
  dark: "Escuro",
};

interface UserMenuButtonProps {
  name: string;
  email: string;
  initials: string;
  avatarUrl: string | null;
  isAdmin: boolean;
}

/** Avatar and name; opens the account menu with the theme and the way out. */
export function UserMenuButton({ name, email, initials, avatarUrl, isAdmin }: UserMenuButtonProps) {
  const [signingOut, startSignOut] = useTransition();
  // the server does not know the stored choice: it renders "system", the browser reads the real one
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "system" as const);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-3 px-1 sm:px-2" aria-label={`Conta de ${name}`}>
          <Avatar>
            {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-40 truncate sm:block">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          <span className="truncate type-label text-ink">{name}</span>
          {email !== name && <span className="truncate type-small text-ink-muted">{email}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/painel/conta">Sua conta</Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/admin">Painel admin</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/painel">Área do cliente</Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="type-small text-ink-muted">Tema</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => applyTheme(value as ThemeChoice)}
        >
          {THEMES.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {THEME_LABELS[option]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signingOut}
          onSelect={() =>
            startSignOut(async () => {
              await signOut();
              // a full load on purpose: nothing of the account stays in the router's memory
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.assign("/login");
            })
          }
        >
          {signingOut ? "Saindo…" : "Sair"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
