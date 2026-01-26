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
import { type Drill } from "@/lib/types/drill";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Pencil, Trash2, Search, X, SearchX } from "lucide-react";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

interface DrillsDataTableProps {
  data: Drill[];
  totalRows: number;
  onEdit?: (drill: Drill) => void;
  onDelete?: (drill: Drill) => void;
}

export function DrillsDataTable({
  data,
  totalRows,
  onEdit,
  onDelete,
}: DrillsDataTableProps) {
  const router = useRouter();
  // Default sort by category ascending, then name for stable ordering
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "category", desc: false },
    { id: "name", desc: false },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (drill: Drill) => {
    if (!confirm(`Are you sure you want to delete "${drill.name}"? This action cannot be undone.`)) {
      return;
    }

    if (onDelete) {
      onDelete(drill);
      return;
    }

    setDeletingId(drill.id);
    try {
      const response = await fetch(`/api/drills/${drill.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete drill");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete drill");
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnDef<Drill>[] = React.useMemo(
    () => [
      {
        accessorKey: "category",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Category" />
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("category")}</div>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => {
          const name = row.getValue("name") as string;
          return (
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div className="max-w-[200px] truncate cursor-help">
                  {name}
                </div>
              </TooltipTrigger>
              <TooltipContent 
                className="max-w-md" 
                side="top"
                sideOffset={8}
              >
                <div className="text-sm">{name}</div>
              </TooltipContent>
            </Tooltip>
          );
        },
      },
      {
        accessorKey: "minutes",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Minutes" />
        ),
        cell: ({ row }) => {
          const minutes = row.getValue("minutes") as number | null;
          return <div className="w-24">{minutes || "-"}</div>;
        },
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => {
          const notes = row.getValue("notes") as string | null;
          if (!notes) {
            return <div>-</div>;
          }

          return (
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div className="max-w-[200px] truncate cursor-help">
                  {notes}
                </div>
              </TooltipTrigger>
              <TooltipContent 
                className="max-w-md" 
                side="top"
                sideOffset={8}
              >
                <div className="whitespace-pre-wrap wrap-break-word text-sm">
                  {notes}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        },
      },
      {
        accessorKey: "media_links",
        header: "Media Links",
        cell: ({ row }) => {
          const mediaLinks = row.getValue("media_links") as string | null;
          if (!mediaLinks) {
            return <div>-</div>;
          }

          return (
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div className="max-w-[200px] truncate cursor-help">
                  <a
                    href={mediaLinks}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()} // Prevent row navigation and tooltip from closing on click
                  >
                    {mediaLinks}
                  </a>
                </div>
              </TooltipTrigger>
              <TooltipContent 
                className="max-w-md" 
                side="top"
                sideOffset={8}
              >
                <div className="text-sm wrap-break-word">{mediaLinks}</div>
              </TooltipContent>
            </Tooltip>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const drill = row.original;
          const isDeleting = deletingId === drill.id;

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
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(drill);
                  }}
                  disabled={isDeleting}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(drill);
                  }}
                  disabled={isDeleting}
                  variant="destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onEdit, deletingId]
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
    globalFilterFn: (row, columnId, filterValue) => {
      const search = filterValue.toLowerCase();
      const drill = row.original;
      
      // Search across name, category, and notes
      const name = drill.name?.toLowerCase() || "";
      const category = drill.category?.toLowerCase() || "";
      const notes = drill.notes?.toLowerCase() || "";
      
      return (
        name.includes(search) ||
        category.includes(search) ||
        notes.includes(search)
      );
    },
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Get filtered row count for pagination
  const filteredRowCount = table.getFilteredRowModel().rows.length;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search drills by name, category, or notes..."
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
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const drill = row.original;
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/library/${drill.id}`)}
                  >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64 p-0">
                  <Empty className="min-h-64 border-0 rounded-none">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <SearchX className="h-6 w-6 text-muted-foreground" />
                      </EmptyMedia>
                      <EmptyTitle>No drills found</EmptyTitle>
                      <EmptyDescription>
                        {globalFilter
                          ? `No drills match your search "${globalFilter}". Try adjusting your search terms.`
                          : "No drills found. Create your first drill to get started."}
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
    </div>
  );
}
