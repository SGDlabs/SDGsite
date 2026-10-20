"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/server/actions/auth";

interface UserMenuButtonProps {
  name: string;
  email: string;
  initials: string;
  avatarUrl: string | null;
  isAdmin: boolean;
}

/** Avatar and name; opens the account menu with the way out. */
export function UserMenuButton({ name, email, initials, avatarUrl, isAdmin }: UserMenuButtonProps) {
  const [signingOut, startSignOut] = useTransition();

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
        {isAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/admin">Painel admin</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/painel">Área do cliente</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          disabled={signingOut}
          onSelect={() =>
            startSignOut(async () => {
              await signOut();
              // a full load: nothing of the account stays in the router's memory
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
