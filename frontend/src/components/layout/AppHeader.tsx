import { LogOut, Shield, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS } from "@/types";

export function AppHeader() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const initials = user?.username.slice(0, 2).toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="size-4" />
          </div>
          <div>
            <p className="font-heading text-sm font-semibold leading-none">Учёт заявок</p>
            <p className="text-xs text-muted-foreground">Внутренняя система</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              {isAdmin && (
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  Администратор
                </Badge>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="sm" className="gap-2">
                      <Avatar className="size-6">
                        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline">{user.username}</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      <div className="flex flex-col gap-1">
                        <span>{user.username}</span>
                        <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem disabled>
                      <User />
                      {ROLE_LABELS[user.role]}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 text-muted-foreground">
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Выйти</span>
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Войти
              </Link>
              <Link to="/register" className={cn(buttonVariants({ size: "sm" }))}>
                Регистрация
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
