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

export default function ImportReviewPage() {
  const router = useRouter();
  const [reviewData, setReviewData] = useState<ImportReviewData | null>(null);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedRows, setEditedRows] = useState<Map<number, DrillImportRow>>(
    new Map()
  );
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    // 🔌 TODO: fetch from the API or session storage
    // TEMP/DEV: Just check if there's data in sessionStorage or redirect
    const storedData = sessionStorage.getItem("importReviewData");
    if (storedData) {
      try {
        setReviewData(JSON.parse(storedData));
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

      // Redirect to success page with import stats
      router.push(
        `/import/success?imported=${result.imported || 0}&skipped=${
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
    router.push("/");
  };

  const previewRows = reviewData.rows.slice(0, PREVIEW_ROWS);
  const hasMoreRows = reviewData.rows.length > PREVIEW_ROWS;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Breadcrumbs */}
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

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Review Your Import</h1>
        <p className="text-muted-foreground text-lg">
          Review and verify your drill data before finalizing the import
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviewData.summary.totalRows}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Valid Rows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reviewData.summary.validRows}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Invalid Rows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {reviewData.summary.invalidRows}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {reviewData.summary.errors.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="mb-6 border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Review Sample Data
              </p>
              <p className="text-sm text-blue-800">
                We're showing the first {PREVIEW_ROWS} rows of your import.
                Please review and edit any rows that need correction. If the
                sample looks correct, you can confirm the import for all{" "}
                {reviewData.summary.totalRows} rows.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Preview Data (First {PREVIEW_ROWS} Rows)</CardTitle>
          <CardDescription>
            Click the edit icon to modify any row. Changes will be applied to
            the full import.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  <TableRow key={index} className={hasError ? "bg-red-50" : ""}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={displayRow.Category || ""}
                          onChange={(e) =>
                            handleFieldChange(index, "Category", e.target.value)
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
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Showing {PREVIEW_ROWS} of {reviewData.summary.totalRows} rows. The
              remaining rows will be imported with the same format.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Errors Section */}
      {reviewData.summary.errors.length > 0 && (
        <Card className="mb-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-900">Import Errors</CardTitle>
            <CardDescription>
              The following rows had errors and will be skipped
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reviewData.summary.errors.map((error, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200"
                >
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      Row {error.row}
                    </p>
                    <p className="text-sm text-red-800">{error.error}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isConfirming}
        >
          Cancel Import
        </Button>
        <Button
          onClick={handleConfirmImport}
          disabled={isConfirming || reviewData.summary.validRows === 0}
        >
          {isConfirming ? (
            <>
              <Save className="mr-2 h-4 w-4 animate-pulse" />
              Confirming...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirm Import ({reviewData.summary.validRows} drills)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
