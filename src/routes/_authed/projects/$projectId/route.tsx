import { createFileRoute, Outlet } from '@tanstack/react-router'
import { getProject } from '@/server/functions/projects'
import { ProjectSidebar } from '@/components/layout/sidebar'

export const Route = createFileRoute('/_authed/projects/$projectId')({
  loader: ({ params }) => getProject({ data: params.projectId }),
  component: ProjectLayout,
})

function ProjectLayout() {
  const result = Route.useLoaderData()

  if (!result.ok) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-destructive">{result.error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1">
      <ProjectSidebar projectId={String(result.data.id)} />
      <div className="flex-1 p-6">
        <Outlet />
      </div>
    </div>
  )
}
