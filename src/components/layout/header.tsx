import { Link } from '@tanstack/react-router'
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/tanstack-react-start'
import { useTranslation } from 'react-i18next'
import { Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { ThemeSwitcher } from '@/components/shared/theme-switcher'
import { APP_NAME } from '@/lib/constants'

export function Header() {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Rocket className="h-5 w-5 text-primary" />
          {APP_NAME}
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/explore"
            search={{ page: 1, search: undefined }}
            className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            {t('explore.title')}
          </Link>
          <div className="mx-1 h-5 w-px bg-border" />
          <ThemeSwitcher />
          <LocaleSwitcher />
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="sm">{t('common.signIn')}</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                {t('dashboard.title')}
              </Button>
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  )
}
