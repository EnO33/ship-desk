import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { RouteLoading } from '@/components/shared/route-loading'
import { RouteError } from '@/components/shared/route-error'
import {
  getRoadmapItems,
  createRoadmapItem,
  deleteRoadmapItem,
  reorderRoadmapItems,
} from '@/server/functions/roadmap'
import { ROADMAP_STATUSES, type RoadmapStatus } from '@/lib/constants'

export const Route = createFileRoute(
  '/_authed/projects/$projectId/roadmap',
)({
  loader: ({ params }) =>
    getRoadmapItems({ data: Number(params.projectId) }),
  component: RoadmapPage,
  pendingComponent: RouteLoading,
  errorComponent: RouteError,
})

const statusColors: Record<RoadmapStatus, string> = {
  planned: 'bg-blue-500/10 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-500/10 text-amber-700 border-amber-200',
  done: 'bg-green-500/10 text-green-700 border-green-200',
}

type Item = {
  id: number
  title: string
  description: string | null
  status: string
  order: number
}

function SortableCard({
  item,
  onDelete,
}: {
  item: Item
  onDelete: (id: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <Card ref={setNodeRef} style={style} className="group">
      <CardContent className="flex items-start gap-2 p-4">
        <button
          className="mt-0.5 cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <p className="font-medium">{item.title}</p>
          {item.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {item.description}
            </p>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </CardContent>
    </Card>
  )
}

function DragOverlayCard({ item }: { item: Item }) {
  return (
    <Card className="shadow-xl shadow-primary/10">
      <CardContent className="flex items-start gap-2 p-4">
        <GripVertical className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div className="flex-1">
          <p className="font-medium">{item.title}</p>
          {item.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {item.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function RoadmapPage() {
  const result = Route.useLoaderData()
  const { projectId } = Route.useParams()
  const { t } = useTranslation()
  const navigate = Route.useNavigate()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [initialized, setInitialized] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  if (!result.ok) {
    return <p className="text-destructive">{result.error}</p>
  }

  // Initialize local state from loader data (once)
  if (!initialized) {
    setItems(result.data as Item[])
    setInitialized(true)
  }

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null

  const getColumnItems = useCallback(
    (status: RoadmapStatus) =>
      items
        .filter((i) => i.status === status)
        .sort((a, b) => a.order - b.order),
    [items],
  )

  const findColumnForItem = (id: number): RoadmapStatus | undefined => {
    const item = items.find((i) => i.id === id)
    return item?.status as RoadmapStatus | undefined
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeItemId = active.id as number
    const overId = over.id

    const activeColumn = findColumnForItem(activeItemId)

    // Check if hovering over a column droppable or another item
    let overColumn: RoadmapStatus | undefined
    if (ROADMAP_STATUSES.includes(overId as RoadmapStatus)) {
      overColumn = overId as RoadmapStatus
    } else {
      overColumn = findColumnForItem(overId as number)
    }

    if (!activeColumn || !overColumn || activeColumn === overColumn) return

    // Move item to new column
    setItems((prev) =>
      prev.map((i) =>
        i.id === activeItemId ? { ...i, status: overColumn } : i,
      ),
    )
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeItemId = active.id as number
    const overId = over.id

    // Determine target column
    let targetColumn: RoadmapStatus
    if (ROADMAP_STATUSES.includes(overId as RoadmapStatus)) {
      targetColumn = overId as RoadmapStatus
    } else {
      const col = findColumnForItem(overId as number)
      if (!col) return
      targetColumn = col
    }

    // Update order within column
    setItems((prev) => {
      const updated = prev.map((i) =>
        i.id === activeItemId ? { ...i, status: targetColumn } : i,
      )

      const columnItems = updated
        .filter((i) => i.status === targetColumn)
        .sort((a, b) => a.order - b.order)

      // Find current and target positions
      const currentIndex = columnItems.findIndex((i) => i.id === activeItemId)
      let targetIndex = columnItems.findIndex((i) => i.id === overId)

      if (targetIndex === -1) {
        // Dropped on column itself — put at end
        targetIndex = columnItems.length - 1
      }

      if (currentIndex !== targetIndex) {
        // Move within array
        const [moved] = columnItems.splice(currentIndex, 1)
        columnItems.splice(targetIndex, 0, moved)
      }

      // Reassign order values
      const reordered = columnItems.map((item, idx) => ({
        ...item,
        order: idx,
      }))

      // Merge back
      const otherItems = updated.filter((i) => i.status !== targetColumn)
      return [...otherItems, ...reordered]
    })

    // Build the update payload for all items in affected columns
    // We need the latest state, so compute it here
    const currentItems = items.map((i) =>
      i.id === activeItemId ? { ...i, status: targetColumn } : i,
    )

    // Recalculate order for the target column
    const columnItems = currentItems
      .filter((i) => i.status === targetColumn)
      .sort((a, b) => a.order - b.order)

    const currentIndex = columnItems.findIndex((i) => i.id === activeItemId)
    let targetIndex = columnItems.findIndex(
      (i) => i.id === (overId as number),
    )
    if (targetIndex === -1) targetIndex = columnItems.length - 1
    if (currentIndex !== targetIndex && currentIndex !== -1) {
      const [moved] = columnItems.splice(currentIndex, 1)
      columnItems.splice(targetIndex, 0, moved)
    }

    const payload = columnItems.map((item, idx) => ({
      id: item.id,
      status: targetColumn as 'planned' | 'in_progress' | 'done',
      order: idx,
    }))

    const res = await reorderRoadmapItems({ data: { items: payload } })
    if (!res.ok) {
      toast.error(res.error)
      // Revert on failure
      setItems(result.data as Item[])
    }
  }

  const handleCreate = async () => {
    const res = await createRoadmapItem({
      data: {
        projectId: Number(projectId),
        title,
        description: description || undefined,
      },
    })
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    setOpen(false)
    setTitle('')
    setDescription('')
    setInitialized(false)
    navigate({ to: '.', reloadDocument: true })
  }

  const handleDelete = async () => {
    if (deleteId === null) return
    const res = await deleteRoadmapItem({ data: deleteId })
    setDeleteId(null)
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== deleteId))
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('roadmap.title')}</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t('roadmap.newItem')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('roadmap.newItem')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder={t('roadmap.title')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                placeholder={t('project.description')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
              <Button onClick={handleCreate} disabled={!title}>
                {t('common.create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">
          {t('roadmap.noItems')}
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-6 md:grid-cols-3">
          {ROADMAP_STATUSES.map((status) => {
            const columnItems = getColumnItems(status)
            return (
              <DroppableColumn
                key={status}
                status={status}
                items={columnItems}
                onDelete={setDeleteId}
              />
            )
          })}
        </div>

        <DragOverlay>
          {activeItem ? <DragOverlayCard item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        description={t('roadmap.deleteConfirm')}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function DroppableColumn({
  status,
  items,
  onDelete,
}: {
  status: RoadmapStatus
  items: Item[]
  onDelete: (id: number) => void
}) {
  const { t } = useTranslation()
  const { setNodeRef } = useDroppable({ id: status })

  return (
    <div ref={setNodeRef} className="space-y-3">
      <div className={`flex items-center gap-2 rounded-lg p-3 ${statusColors[status]}`}>
        <span className="font-medium">
          {t(`roadmap.status.${status}`)}
        </span>
        <span className="text-sm opacity-70">{items.length}</span>
      </div>
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="min-h-[60px] space-y-2">
          {items.map((item) => (
            <SortableCard key={item.id} item={item} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
