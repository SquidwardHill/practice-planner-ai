"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ButtonGroup } from "@/components/ui/button-group";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Save,
  X,
  SquarePen,
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ClockAlert,
  ClockPlus,
  ShieldAlert,
} from "lucide-react";
import { type DrillImportRow } from "@/lib/types/drill";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { H1, H3, P, Small } from "@/components/atoms/typography";

interface ImportReviewData {
  rows: DrillImportRow[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    errors: Array<{ row: number; error: string }>;
  };
}

const PREVIEW_ROWS = 10; // Show first 10 rows for review
const ERRORS_PER_PAGE = 5; // Show 10 errors per page

export default function ImportReviewPage() {
  const router = useRouter();
  const [reviewData, setReviewData] = useState<ImportReviewData | null>(null);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedRows, setEditedRows] = useState<Map<number, DrillImportRow>>(
    new Map(),
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorPage, setErrorPage] = useState(1);
  const [defaultDuration, setDefaultDuration] = useState<number>(5);
  const [hasUserSetDefaultDuration, setHasUserSetDefaultDuration] =
    useState<boolean>(false);

  useEffect(() => {
    // 🔌 TODO: fetch from the API or session storage
    // TEMP/DEV: Just check if there's data in sessionStorage or redirect
    const storedData = sessionStorage.getItem("importReviewData");
    if (storedData) {
      try {
        setReviewData(JSON.parse(storedData));
        setErrorPage(1); // Reset to first page when data loads
      } catch (error) {
        console.error("Failed to parse import data:", error);
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  if (!reviewData) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center">
          <P className="text-muted-foreground">Loading import review...</P>
        </div>
      </div>
    );
  }

  const handleEdit = (index: number) => {
    setEditingRow(index);
    const row = reviewData.rows[index];
    const edited = editedRows.get(index);
    if (!edited) {
      setEditedRows(new Map(editedRows.set(index, { ...row })));
    }
  };

  const handleSaveEdit = (index: number) => {
    setEditingRow(null);
    // The edited data is already in editedRows state
  };

  const handleCancelEdit = (index: number) => {
    setEditingRow(null);
    const newEditedRows = new Map(editedRows);
    newEditedRows.delete(index);
    setEditedRows(newEditedRows);
  };

  const handleFieldChange = (
    index: number,
    field: keyof DrillImportRow,
    value: string | number,
  ) => {
    const edited = editedRows.get(index) || { ...reviewData.rows[index] };
    edited[field] = value as any;
    setEditedRows(new Map(editedRows.set(index, edited)));
  };

  const handleConfirmImport = async () => {
    setIsConfirming(true);
    try {
      // Merge edited rows back into the data (only PREVIEW_ROWS) and apply default duration to unset Minutes values
      const finalRows = reviewData.rows.map((row, index) => {
        let finalRow: DrillImportRow;

        // Update and Persist (1): Apply user edits to preview rows first (manually set durations are preserved)
        if (index < PREVIEW_ROWS && editedRows.has(index)) {
          finalRow = editedRows.get(index)!;
        } else {
          finalRow = { ...row };
        }

        // Update and Persist (2): Only update unset Minutes values
        if (
          finalRow.Minutes === undefined ||
          finalRow.Minutes === null ||
          finalRow.Minutes === "" ||
          (typeof finalRow.Minutes === "number" && finalRow.Minutes === 0) ||
          (typeof finalRow.Minutes === "string" &&
            parseInt(finalRow.Minutes, 10) === 0)
        ) {
          finalRow.Minutes = defaultDuration;
        }

        return finalRow;
      });

      const response = await fetch("/api/drills/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: finalRows }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || "Failed to confirm import",
        );
      }

      const result = await response.json();

      sessionStorage.removeItem("importReviewData");

      router.push(
        `/library?imported=${result.imported || 0}&skipped=${
          result.skipped || 0
        }`,
      );
    } catch (error) {
      console.error("Import confirmation error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to confirm import. Please try again.";
      alert(errorMessage);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem("importReviewData");
    router.push("/library");
  };

  const previewRows = reviewData.rows.slice(0, PREVIEW_ROWS);
  const hasMoreRows = reviewData.rows.length > PREVIEW_ROWS;

  // Helper function to check if a row has unset Minutes
  const hasUnsetMinutes = (row: DrillImportRow): boolean => {
    return (
      row.Minutes === undefined ||
      row.Minutes === null ||
      row.Minutes === "" ||
      (typeof row.Minutes === "number" && row.Minutes === 0) ||
      (typeof row.Minutes === "string" && parseInt(row.Minutes, 10) === 0)
    );
  };

  // Count drills without duration
  const drillsWithoutDuration = reviewData.rows.filter(hasUnsetMinutes).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Import Review</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-12">
        <H1 className="mb-8">Review Your Import</H1>
        {/* Summary Stats */}
        <div className="grid grid-cols-5 gap-2 mb-4 border rounded-lg px-4 py-2 max-w-2xl mt-4">
          <div className="col-span-1 border-r pr-2">
            <Small className="mb-1">Total Rows</Small>
            <H3>{reviewData.summary.totalRows}</H3>
          </div>
          <div className="col-span-1 border-r pr-2 ">
            <Small className="mb-1 inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500/60" />
              Valid
            </Small>
            <H3>{reviewData.summary.validRows}</H3>
          </div>
          <div className="col-span-1 border-r pr-2">
            <Small className="mb-1 inline-flex items-center  gap-1">
              <XCircle className="h-3 w-3 text-destructive/60" />
              Invalid
            </Small>
            <H3>{reviewData.summary.invalidRows}</H3>
          </div>
          <div className="col-span-1 border-r pr-2">
            <Small className="mb-1 inline-flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-orange-400/60" />
              Errors
            </Small>
            <H3>{reviewData.summary.errors.length}</H3>
          </div>
          <div className="col-span-1">
            <Small className="mb-1 inline-flex items-center  gap-1">
              <AlertTriangle className="h-3 w-3 text-yellow-500/60" />
              Warnings
            </Small>
            <H3>{drillsWithoutDuration}</H3>
          </div>
        </div>
        {reviewData.summary.validRows > 0 && (
          <div className="mb-12 space-y-4">
            {/* [Section] Default Min Duration*/}
            {drillsWithoutDuration > 0 && (
              <div>
                <div className="flex w-full max-w-2xl flex-col gap-6">
                  <Item variant="outline">
                    <ItemMedia variant="icon">
                      <ShieldAlert />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="text-base">
                        Minimum Duration Required
                      </ItemTitle>
                      <ItemDescription>
                        {drillsWithoutDuration} drill
                        {drillsWithoutDuration !== 1 ? "s" : ""} have no
                        "Minutes" (drill duration)column value. Please set a
                        default value (1 minute minimum), and then review the
                        sample of your data below.
                        <div className="mt-4 flex items-center gap-2">
                          {hasUserSetDefaultDuration ? (
                            <ClockPlus className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <ClockAlert className="h-4 w-4 text-yellow-500" />
                          )}
                          <div>Set fallback "Minutes" value: </div>
                          <ButtonGroup>
                            <Input
                              id="default-duration"
                              type="number"
                              min="1"
                              value={defaultDuration}
                              onChange={(e) => {
                                const value = parseInt(e.target.value, 10);
                                if (!isNaN(value) && value >= 1) {
                                  setDefaultDuration(value);
                                  setHasUserSetDefaultDuration(true);
                                }
                              }}
                              className={`h-7 font-mono [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]`}
                              size={2}
                              maxLength={3}
                            />
                            <Button
                              variant="outline"
                              type="button"
                              aria-label="Decrement"
                              onClick={() => {
                                if (defaultDuration > 1) {
                                  setDefaultDuration(defaultDuration - 1);
                                  setHasUserSetDefaultDuration(true);
                                }
                              }}
                              className="size-7 rounded-[min(var(--radius-md),12px)]"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              type="button"
                              aria-label="Increment"
                              onClick={() => {
                                setDefaultDuration(defaultDuration + 1);
                                setHasUserSetDefaultDuration(true);
                              }}
                              className="size-7 rounded-[min(var(--radius-md),12px)]"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </ButtonGroup>
                        </div>
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Table - Only show if there are valid rows */}
      {reviewData.summary.validRows > 0 && (
        <div className="mb-12">
          <div className="mb-4">
            <H3 className="mb-1">Preview Your Data</H3>
            <P className="max-w-3xl">
              To ensure your drill data is being parsed correctly, we'll do a
              spot check on the first {PREVIEW_ROWS} rows of your import. Please
              review and edit as needed, then confirm to import all{" "}
              {reviewData.summary.totalRows} rows.
            </P>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-20">Minutes</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Media Links</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, index) => {
                  const isEditing = editingRow === index;
                  const editedRow = editedRows.get(index);
                  const displayRow = editedRow || row;
                  const hasError = reviewData.summary.errors.some(
                    (e) => e.row === index + 1,
                  );

                  return (
                    <TableRow
                      key={index}
                      className={`${hasError ? "bg-destructive/5" : ""} ${
                        !isEditing ? "cursor-pointer hover:bg-muted/50" : ""
                      } transition-colors`}
                      onClick={() => {
                        if (!isEditing) {
                          handleEdit(index);
                        }
                      }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={displayRow.Category || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "Category",
                                e.target.value,
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="h-8"
                          />
                        ) : (
                          displayRow.Category || "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={displayRow.Name || ""}
                            onChange={(e) =>
                              handleFieldChange(index, "Name", e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="h-8"
                          />
                        ) : (
                          displayRow.Name || "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={displayRow.Minutes || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "Minutes",
                                e.target.value ? parseInt(e.target.value) : 0,
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 w-20"
                          />
                        ) : hasUnsetMinutes(displayRow) ? (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">-</span>
                            <Badge
                              variant="outline"
                              className="text-xs bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400"
                            >
                              → {defaultDuration} min
                            </Badge>
                          </div>
                        ) : (
                          displayRow.Minutes
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {isEditing ? (
                          <Input
                            value={displayRow.Notes || ""}
                            onChange={(e) =>
                              handleFieldChange(index, "Notes", e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="h-8"
                          />
                        ) : (
                          displayRow.Notes || "-"
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {isEditing ? (
                          <Input
                            value={displayRow["Media Links"] || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "Media Links",
                                e.target.value,
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="h-8"
                          />
                        ) : (
                          displayRow["Media Links"] || "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div
                            className="flex gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => handleSaveEdit(index)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => handleCancelEdit(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 bg-primary/10 rounded-md border-primary/50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(index);
                            }}
                          >
                            <SquarePen className="h-2 w-2 " />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {hasMoreRows && (
              <div className="p-4 text-base text-muted-foreground text-center border-t">
                Showing {PREVIEW_ROWS} of {reviewData.summary.totalRows} rows.
                The remaining rows will be imported with the same format.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Errors Section */}
      {/* TODO: POST-MVP - For duplicate errors, add UI to let users choose:
            - Skip duplicate (current behavior)
            - Overwrite existing drill
            - Rename duplicate automatically
            - Show side-by-side comparison to merge */}
      {reviewData.summary.errors.length > 0 && (
        <div className="mb-12">
          <div className="mb-3 flex flex-col md:flex-row items-start md:items-center justify-between pr-2">
            <H3>Import Errors</H3>
            {reviewData.summary.validRows === 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <Small className="text-destructive font-normal">
                  All rows have errors
                </Small>
              </div>
            )}
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Row</TableHead>
                  <TableHead>Error Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewData.summary.errors
                  .slice(
                    (errorPage - 1) * ERRORS_PER_PAGE,
                    errorPage * ERRORS_PER_PAGE,
                  )
                  .map((error, index) => (
                    <TableRow
                      key={index}
                      className="bg-destructive/5 hover:bg-destructive/10"
                    >
                      <TableCell>
                        <span className="font-medium px-2">{error.row}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-destructive shrink-0" />
                          <Small className="text-muted-foreground">
                            {error.error}
                          </Small>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            {/* Pagination controls */}
            {reviewData.summary.errors.length > ERRORS_PER_PAGE && (
              <div className="flex items-center justify-between border-t p-4">
                <Small className="text-muted-foreground">
                  Showing {(errorPage - 1) * ERRORS_PER_PAGE + 1} to{" "}
                  {Math.min(
                    errorPage * ERRORS_PER_PAGE,
                    reviewData.summary.errors.length,
                  )}{" "}
                  of {reviewData.summary.errors.length} errors
                </Small>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setErrorPage((p) => Math.max(1, p - 1))}
                    disabled={errorPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Small className="text-muted-foreground min-w-[80px] text-center">
                    Page {errorPage} of{" "}
                    {Math.ceil(
                      reviewData.summary.errors.length / ERRORS_PER_PAGE,
                    )}
                  </Small>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setErrorPage((p) =>
                        Math.min(
                          Math.ceil(
                            reviewData.summary.errors.length / ERRORS_PER_PAGE,
                          ),
                          p + 1,
                        ),
                      )
                    }
                    disabled={
                      errorPage >=
                      Math.ceil(
                        reviewData.summary.errors.length / ERRORS_PER_PAGE,
                      )
                    }
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isConfirming}
        >
          Cancel Import
          <X className=" h-4 w-4" />
        </Button>
        <Button
          onClick={handleConfirmImport}
          disabled={isConfirming || reviewData.summary.validRows === 0}
        >
          {isConfirming ? (
            <>
              Confirming...
              <Save className=" h-4 w-4 animate-pulse" />
            </>
          ) : (
            <>
              Confirm Import ({reviewData.summary.validRows} drills)
              <CheckCircle2 className=" h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
