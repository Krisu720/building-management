'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  Building2,
  ChevronRight,
  ClipboardList,
  House,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Settings2,
  UsersRound,
  Wrench,
  X,
} from 'lucide-react';
import { getInitials, isAdmin } from '@/lib/user-display';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

const navLinkClassName =
  "flex items-center gap-[11px] min-h-[42px] p-[10px_13px] rounded-[7px] text-[#5c6879] text-[13px] font-[450] [transition:background-color_120ms_ease,_color_120ms_ease] aria-[current=page]:bg-[#0866f5] aria-[current=page]:text-white aria-[current=page]:shadow-[0_2px_5px_#0866f51a] aria-[current=page]:font-[500] focus-visible:[outline:2px_solid_#6ea8ff] focus-visible:outline-offset-[3px] [@media(hover:hover)_and_(pointer:fine)]:[&:hover:not([aria-current='page'])]:bg-[#f3f7fd] [@media(hover:hover)_and_(pointer:fine)]:[&:hover:not([aria-current='page'])]:text-[#0866f5]";

type User = typeof authClient.$Infer.Session.user;
const AccountContext = createContext<{
  user: User;
  refresh: () => void;
} | null>(null);

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) throw new Error('useAccount must be used inside AccountShell');
  return context;
}

const accountNavigation = [
  { href: '/', label: 'Panel główny', icon: LayoutDashboard },
  { href: '/buildings', label: 'Budynki', icon: Building2 },
  { href: '/residents', label: 'Mieszkańcy', icon: UsersRound },
  { href: '/requests', label: 'Zgłoszenia', icon: ClipboardList },
  { href: '/my-requests', label: 'Moje zgłoszenia', icon: ClipboardList },
  { href: '/inspections', label: 'Przeglądy techniczne', icon: Wrench },
];

export function AccountShell({ children }: { children: ReactNode }) {
  const { data: session, isPending, error, refetch } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  useEffect(() => {
    if (!isPending && !session && !error) router.replace('/login');
  }, [isPending, session, error, router]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const closeMenu = () => setMobileOpen(false);

  async function signOut() {
    setSigningOut(true);
    setSignOutError('');
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setSignOutError('Nie udało się wylogować. Spróbuj ponownie.');
      } else {
        router.replace('/login');
        router.refresh();
      }
    } catch {
      setSignOutError('Brak połączenia z serwerem. Spróbuj ponownie.');
    } finally {
      setSigningOut(false);
    }
  }

  if (!session) {
    return (
      <main className="min-h-[100svh] max-w-none m-0 p-[24px] grid place-items-center bg-white text-[#718096] text-[15px]">
        {error ? (
          <div className="flex flex-col items-center gap-[16px]">
            <h1 className="text-[#263448] text-[20px]">
              Nie można sprawdzić sesji
            </h1>
            <p>Sprawdź połączenie i spróbuj ponownie.</p>
            <Button onClick={() => void refetch()}>Spróbuj ponownie</Button>
          </div>
        ) : (
          <p className="flex items-center gap-[9px]" role="status">
            <LoaderCircle
              size={18}
              className="animate-[spin_700ms_linear_infinite] motion-reduce:animate-none"
            />
            {isPending
              ? 'Sprawdzanie sesji…'
              : 'Przekierowywanie do logowania…'}
          </p>
        )}
      </main>
    );
  }

  const administrator = isAdmin(session.user.role);
  const panelTitle = administrator
    ? 'Panel administracyjny'
    : 'Panel użytkownika';
  const initials = getInitials(session.user.name);
  const navigation = accountNavigation.filter(({ href }) =>
    administrator
      ? href !== '/my-requests'
      : !['/buildings', '/residents'].includes(href),
  );

  return (
    <AccountContext.Provider
      value={{ user: session.user, refresh: () => void refetch() }}
    >
      <div className="min-h-[100svh] bg-white text-[#1c2738]">
        <a
          className="fixed top-[-100px] left-[250px] z-[100] p-[12px] bg-white [border:2px_solid_#0866f5] rounded-[6px] text-[14px] focus:top-[12px] max-[800px]:left-[20px] max-[800px]:focus:top-[65px]"
          href="#admin-content"
        >
          Przejdź do treści
        </a>
        <header className="hidden max-[800px]:sticky max-[800px]:top-0 max-[800px]:z-[60] max-[800px]:flex max-[800px]:items-center max-[800px]:justify-between max-[800px]:h-[58px] max-[800px]:bg-white max-[800px]:[border-bottom:1px_solid_#e8edf3] max-[800px]:p-[0_20px]">
          <span className="max-[800px]:flex max-[800px]:items-center max-[800px]:gap-[9px] max-[800px]:text-[16px] max-[800px]:font-[550]">
            <House className="max-[800px]:text-[#0866f5]" size={22} />
            {panelTitle}
          </span>
          <button
            className="focus-visible:[outline:2px_solid_#6ea8ff] focus-visible:outline-offset-[3px] max-[800px]:w-[36px] max-[800px]:h-[36px] max-[800px]:grid max-[800px]:place-items-center max-[800px]:rounded-[6px] max-[800px]:text-[#53677e]"
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Zamknij menu' : 'Otwórz menu'}
            aria-expanded={mobileOpen}
            aria-controls="admin-sidebar"
          >
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </header>
        {mobileOpen && (
          <button
            className="hidden max-[800px]:block max-[800px]:fixed max-[800px]:[inset:58px_0_0] max-[800px]:z-[40] max-[800px]:bg-[#10274340]"
            aria-label="Zamknij menu"
            onClick={closeMenu}
          />
        )}
        <aside
          id="admin-sidebar"
          className="fixed [inset:0_auto_0_0] z-[50] flex flex-col w-[260px] bg-white [border-right:1px_solid_#e8edf3] p-[28px_14px_16px] max-[800px]:invisible max-[800px]:[transform:translateX(-100%)] max-[800px]:top-[58px] max-[800px]:pt-[24px] max-[800px]:[&[data-open='true']]:visible max-[800px]:[&[data-open='true']]:transform-none"
          data-open={mobileOpen}
        >
          <Link
            href="/"
            className="flex items-center gap-[10px] p-[0_8px] mb-[42px] text-[17px] font-[600] leading-[1.25] tracking-[-0.45px] focus-visible:[outline:2px_solid_#6ea8ff] focus-visible:outline-offset-[3px]"
            onClick={closeMenu}
          >
            <span className="grid place-items-center w-[28px] h-[34px] shrink-0 text-[#0866f5]">
              <House size={27} strokeWidth={1.7} />
            </span>
            <span className="min-w-0">{panelTitle}</span>
          </Link>
          <div className="p-[0_14px] mb-[12px] text-[10px] font-[550] text-[#9aa5b5] tracking-[1.5px]">
            ZARZĄDZANIE
          </div>
          <nav className="flex flex-col gap-[5px]" aria-label="Menu główne">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={navLinkClassName}
                aria-current={pathname === href ? 'page' : undefined}
                onClick={closeMenu}
              >
                <Icon className="shrink-0" size={18} strokeWidth={1.7} />
                <span>
                  {href === '/requests' && !administrator
                    ? 'Zgłoś usterkę'
                    : label}
                </span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto pt-[40px]">
            <Link
              href="/settings"
              className={navLinkClassName}
              aria-current={pathname === '/settings' ? 'page' : undefined}
              onClick={closeMenu}
            >
              <Settings2 className="shrink-0" size={18} strokeWidth={1.7} />
              <span>Ustawienia konta</span>
            </Link>
            <Link
              href="/settings"
              className="flex gap-[10px] items-center p-[18px_5px_16px] [border-top:1px_solid_#e8edf3] mt-[16px] focus-visible:[outline:2px_solid_#6ea8ff] focus-visible:outline-offset-[3px] [@media(hover:hover)_and_(pointer:fine)]:[&:hover]:text-[#0866f5]"
              onClick={closeMenu}
            >
              <span className="grid place-items-center shrink-0 w-[37px] h-[37px] [border:1px_solid_#e5e7eb] rounded-[8px] text-[#546176] text-[12px] font-[600]">
                {initials}
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block whitespace-nowrap overflow-hidden text-ellipsis text-[12px] font-[550]">
                  {session.user.name}
                </strong>
                <small className="block whitespace-nowrap overflow-hidden text-ellipsis text-[11px] text-[#7a8799] mt-[4px]">
                  {session.user.email}
                </small>
              </span>
              <ChevronRight
                className="shrink-0 text-[#98a5b7]"
                size={15}
                aria-hidden="true"
              />
            </Link>
            {signOutError && (
              <p
                className="text-[12px] leading-[1.5] p-[8px] text-[#b42318]"
                role="alert"
              >
                {signOutError}
              </p>
            )}
            <button
              type="button"
              className="flex items-center gap-[10px] p-[9px_12px] text-[#7c899a] text-[12px] w-full rounded-[6px] disabled:opacity-[0.5] focus-visible:[outline:2px_solid_#6ea8ff] focus-visible:outline-offset-[3px] [@media(hover:hover)_and_(pointer:fine)]:[&:hover]:bg-[#f3f7fd] [@media(hover:hover)_and_(pointer:fine)]:[&:hover]:text-[#0866f5]"
              disabled={signingOut}
              onClick={() => void signOut()}
            >
              <LogOut size={16} />
              <span>{signingOut ? 'Wylogowywanie…' : 'Wyloguj się'}</span>
            </button>
          </div>
        </aside>
        <main
          id="admin-content"
          className="max-w-none min-h-[100svh] m-[0_0_0_260px] p-0 outline-none max-[800px]:ml-0 max-[800px]:min-h-[calc(100svh_-_58px)]"
          tabIndex={-1}
          aria-label="Obszar roboczy panelu"
        >
          {children}
        </main>
      </div>
    </AccountContext.Provider>
  );
}
