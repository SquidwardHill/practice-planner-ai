"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  X,
  Edit2,
  Check,
  ChevronLeft,
  ChevronRight,
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
import { H1, H2, H3, P, Small } from "@/components/atoms/typography";

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
    new Map()
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorPage, setErrorPage] = useState(1);

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
          <p className="text-muted-foreground">Loading import review...</p>
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
    value: string | number
  ) => {
    const edited = editedRows.get(index) || { ...reviewData.rows[index] };
    edited[field] = value as any;
    setEditedRows(new Map(editedRows.set(index, edited)));
  };

  const handleConfirmImport = async () => {
    setIsConfirming(true);
    try {
      // Merge edited rows back into the data
      // Only merge edited rows from the preview (first PREVIEW_ROWS)
      // All other rows remain unchanged
      const finalRows = reviewData.rows.map((row, index) => {
        // Only apply edits to rows that were in the preview and were edited
        if (index < PREVIEW_ROWS && editedRows.has(index)) {
          return editedRows.get(index)!;
        }
        return row;
      });

      const response = await fetch("/api/drills/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: finalRows }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || "Failed to confirm import"
        );
      }

      const result = await response.json();

      sessionStorage.removeItem("importReviewData");

      // Redirect directly to library page with import stats
      router.push(
        `/library?imported=${result.imported || 0}&skipped=${
          result.skipped || 0
        }`
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
        <H1 className="mb-2">Review Your Import</H1>
        <P className="text-muted-foreground">
          Review and verify your drill data before finalizing the import
        </P>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div>
          <Small className="mb-1">Total Rows</Small>
          <H2>{reviewData.summary.totalRows}</H2>
        </div>
        <div>
          <Small className="mb-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Valid
          </Small>
          <H2>{reviewData.summary.validRows}</H2>
        </div>
        <div>
          <Small className="mb-1 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Invalid
          </Small>
          <H2>{reviewData.summary.invalidRows}</H2>
        </div>
        <div>
          <Small className="mb-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Errors
          </Small>
          <H2>{reviewData.summary.errors.length}</H2>
        </div>
      </div>

      {/* Info Note - Only show if there are valid rows */}
      {reviewData.summary.validRows > 0 && (
        <div className="mb-12 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <Small className="font-medium mb-1">Review Sample Data</Small>
              <Small className="text-muted-foreground">
                Showing the first {PREVIEW_ROWS} rows. Review and edit as
                needed, then confirm to import all{" "}
                {reviewData.summary.totalRows} rows.
              </Small>
            </div>
          </div>
        </div>
      )}

      {/* Preview Table - Only show if there are valid rows */}
      {reviewData.summary.validRows > 0 && (
        <div className="mb-12">
          <div className="mb-4">
            <H3 className="mb-1">Preview Data</H3>
            <Small className="text-muted-foreground">
              Click the edit icon to modify any row. Changes will be applied to
              the full import.
            </Small>
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
                    (e) => e.row === index + 1
                  );

                  return (
                    <TableRow
                      key={index}
                      className={hasError ? "bg-destructive/5" : ""}
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
                                e.target.value
                              )
                            }
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
                                e.target.value ? parseInt(e.target.value) : 0
                              )
                            }
                            className="h-8 w-20"
                          />
                        ) : (
                          displayRow.Minutes || "-"
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {isEditing ? (
                          <Input
                            value={displayRow.Notes || ""}
                            onChange={(e) =>
                              handleFieldChange(index, "Notes", e.target.value)
                            }
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
                                e.target.value
                              )
                            }
                            className="h-8"
                          />
                        ) : (
                          displayRow["Media Links"] || "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex gap-1">
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
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleEdit(index)}
                          >
                            <Edit2 className="h-3 w-3" />
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
                    errorPage * ERRORS_PER_PAGE
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
                    reviewData.summary.errors.length
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
                      reviewData.summary.errors.length / ERRORS_PER_PAGE
                    )}
                  </Small>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setErrorPage((p) =>
                        Math.min(
                          Math.ceil(
                            reviewData.summary.errors.length / ERRORS_PER_PAGE
                          ),
                          p + 1
                        )
                      )
                    }
                    disabled={
                      errorPage >=
                      Math.ceil(
                        reviewData.summary.errors.length / ERRORS_PER_PAGE
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
