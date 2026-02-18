import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  Map,
  MessageSquare,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { key: 'changelog', icon: FileText, path: 'changelog' },
  { key: 'roadmap', icon: Map, path: 'roadmap' },
  { key: 'feedback', icon: MessageSquare, path: 'feedback' },
  { key: 'settings', icon: Settings, path: 'settings' },
] as const

export function ProjectSidebar({ projectId }: { projectId: string }) {
  const { t } = useTranslation()

  return (
    <aside className="w-56 shrink-0 border-r bg-muted/30">
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map(({ key, icon: Icon, path }) => (
          <Link
            key={key}
            to={`/projects/$projectId/${path}`}
            params={{ projectId }}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
            )}
            activeProps={{
              className:
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium bg-accent text-accent-foreground',
            }}
          >
            <Icon className="h-4 w-4" />
            {t(`project.${key}`)}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
