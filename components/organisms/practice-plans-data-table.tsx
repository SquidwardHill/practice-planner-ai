"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableColumnHeader } from "@/components/molecules/data-table-column-header";
import { DataTablePagination } from "@/components/molecules/data-table-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarUi } from "@/components/ui/calendar";
import {
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  X,
  SearchX,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

export interface PracticePlanRow {
  id: string;
  practice_title: string;
  total_duration_minutes: number;
  created_at: string;
}

export interface PracticePlansDataTableProps {
  data: PracticePlanRow[];
  totalRows: number;
  onDelete?: (plan: PracticePlanRow) => void;
  /** When a row is clicked, open it for editing (e.g. switch to Generate tab with plan loaded) */
  onSelectPlan?: (plan: PracticePlanRow) => void;
}

function formatPlanDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PracticePlansDataTable({
  data,
  totalRows,
  onDelete,
  onSelectPlan,
}: PracticePlansDataTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = React.useState(false);
  const [schedulePlan, setSchedulePlan] = React.useState<PracticePlanRow | null>(
    null,
  );
  const [scheduleDate, setScheduleDate] = React.useState<Date | undefined>(
    undefined,
  );
  const [scheduling, setScheduling] = React.useState(false);
  const [scheduleSuccessMessage, setScheduleSuccessMessage] = React.useState<
    string | null
  >(null);

  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const handleScheduleClick = (plan: PracticePlanRow) => {
    setSchedulePlan(plan);
    setScheduleDate(undefined);
    setScheduleModalOpen(true);
  };

  const handleScheduleConfirm = async () => {
    if (!schedulePlan || !scheduleDate) return;
    const dateKey = scheduleDate.toISOString().slice(0, 10);
    setScheduling(true);
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          practice_plan_id: schedulePlan.id,
          scheduled_date: dateKey,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "Failed to schedule plan",
        );
      }
      const formattedDate = scheduleDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      setScheduleSuccessMessage(
        `Successfully scheduled ${schedulePlan.practice_title} for ${formattedDate}`,
      );
      window.setTimeout(() => {
        setScheduleModalOpen(false);
        setSchedulePlan(null);
        setScheduleDate(undefined);
        setScheduleSuccessMessage(null);
        router.refresh();
      }, 1800);
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error ? err.message : "Failed to schedule. Try again.",
      );
    } finally {
      setScheduling(false);
    }
  };

  const handleDelete = async (plan: PracticePlanRow) => {
    if (
      !confirm(
        `Are you sure you want to delete "${plan.practice_title}"? This cannot be undone.`
      )
    ) {
      return;
    }

    if (onDelete) {
      onDelete(plan);
      return;
    }

    setDeletingId(plan.id);
    try {
      const response = await fetch(`/api/plans/${plan.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(
          (res as { error?: string }).error ?? "Failed to delete plan"
        );
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete plan");
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnDef<PracticePlanRow>[] = React.useMemo(
    () => [
      {
        accessorKey: "practice_title",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Title" />
        ),
        cell: ({ row }) => {
          const title = row.getValue("practice_title") as string;
          return (
            <div className="font-medium max-w-[280px] truncate" title={title}>
              {title}
            </div>
          );
        },
      },
      {
        accessorKey: "total_duration_minutes",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Duration" />
        ),
        cell: ({ row }) => {
          const minutes = row.getValue("total_duration_minutes") as number;
          return <div className="w-24">{minutes} min</div>;
        },
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created" />
        ),
        cell: ({ row }) => {
          const created = row.getValue("created_at") as string;
          return (
            <div className="text-muted-foreground text-sm">
              {formatPlanDate(created)}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const plan = row.original;
          const isDeleting = deletingId === plan.id;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => e.stopPropagation()}
              >
                {onSelectPlan && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPlan(plan);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScheduleClick(plan);
                  }}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(plan);
                  }}
                  disabled={isDeleting}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting…" : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [deletingId]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = filterValue.toLowerCase();
      const plan = row.original;
      const title = plan.practice_title?.toLowerCase() || "";
      return title.includes(search);
    },
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  const filteredRowCount = table.getFilteredRowModel().rows.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search plans by title..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 pr-9"
          />
          {globalFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
              onClick={() => setGlobalFilter("")}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
        {globalFilter && (
          <div className="text-sm text-muted-foreground">
            {filteredRowCount} {filteredRowCount === 1 ? "result" : "results"}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={
                    onSelectPlan
                      ? "cursor-pointer hover:bg-muted/50 transition-colors"
                      : "hover:bg-muted/50 transition-colors"
                  }
                  onClick={
                    onSelectPlan
                      ? () => onSelectPlan(row.original)
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={
                        cell.column.id === "actions" && onSelectPlan
                          ? (e) => e.stopPropagation()
                          : undefined
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64 p-0">
                  <Empty className="min-h-64 border-0 rounded-none">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <SearchX className="h-6 w-6 text-muted-foreground" />
                      </EmptyMedia>
                      <EmptyTitle>No plans found</EmptyTitle>
                      <EmptyDescription>
                        {globalFilter
                          ? `No plans match "${globalFilter}". Try different search terms.`
                          : "No saved plans yet. Generate a plan above and use Finalize & Save."}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        table={table}
        totalRows={globalFilter ? filteredRowCount : totalRows}
      />

      <Dialog
        open={scheduleModalOpen}
        onOpenChange={(open) => {
          setScheduleModalOpen(open);
          if (!open) {
            setScheduleSuccessMessage(null);
            setSchedulePlan(null);
            setScheduleDate(undefined);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          {scheduleSuccessMessage ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
              <p className="text-center text-sm text-foreground">
                {scheduleSuccessMessage}
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Schedule plan</DialogTitle>
                <DialogDescription>
                  {schedulePlan
                    ? `Choose a date to add "${schedulePlan.practice_title}" to your calendar.`
                    : "Choose a date."}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-2">
                <CalendarUi
                  mode="single"
                  selected={scheduleDate}
                  onSelect={setScheduleDate}
                  disabled={(date) => date < today}
                  initialFocus
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setScheduleModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleScheduleConfirm}
                  disabled={!scheduleDate || scheduling}
                >
                  {scheduling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scheduling…
                    </>
                  ) : (
                    "Add to schedule"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
