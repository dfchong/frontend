"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
<<<<<<< Updated upstream
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
=======
>>>>>>> Stashed changes
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
<<<<<<< Updated upstream
import type { ProTableColumns } from "@workspace/ui/composed/pro-table/pro-table";
import { ProTable } from "@workspace/ui/composed/pro-table/pro-table";
import {
  filterErrorLog,
  runDiagnostic,
} from "@workspace/ui/services/admin/log";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const levelColors: Record<
  string,
  "destructive" | "default" | "secondary" | "outline"
> = {
=======
import { ProTable } from "@workspace/ui/composed/pro-table/pro-table";
import { useTranslation } from "react-i18next";
import { filterErrorLog, runDiagnostic } from "@workspace/ui/services/admin/log";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import type { ProTableColumns } from "@workspace/ui/composed/pro-table/pro-table";

const levelColors: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
>>>>>>> Stashed changes
  panic: "destructive",
  critical: "destructive",
  error: "destructive",
  warning: "secondary",
};

function DiagnosticPanel() {
  const { t } = useTranslation("log");
  const [diag, setDiag] = useState<API.DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    try {
      const { data } = await runDiagnostic();
      setDiag(data?.data?.diagnostic || null);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("title.diagnostic", "System Diagnostic")}</CardTitle>
<<<<<<< Updated upstream
        <Button disabled={loading} onClick={handleRun} size="sm">
          {loading
            ? t("running", "Running...")
            : t("runDiagnostic", "Run Diagnostic")}
=======
        <Button onClick={handleRun} disabled={loading} size="sm">
          {loading ? t("running", "Running...") : t("runDiagnostic", "Run Diagnostic")}
>>>>>>> Stashed changes
        </Button>
      </CardHeader>
      {diag && (
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
<<<<<<< Updated upstream
              <span className="font-medium">
                {t("column.services", "Services")}:
              </span>
              <ul className="mt-1 ml-4">
                {Object.entries(diag.services || {}).map(([name, status]) => (
                  <li className="flex items-center gap-2" key={name}>
                    <Badge
                      variant={status === "ok" ? "default" : "destructive"}
                    >
=======
              <span className="font-medium">{t("column.services", "Services")}:</span>
              <ul className="ml-4 mt-1">
                {Object.entries(diag.services || {}).map(([name, status]) => (
                  <li key={name} className="flex items-center gap-2">
                    <Badge variant={status === "ok" ? "default" : "destructive"}>
>>>>>>> Stashed changes
                      {name}
                    </Badge>
                    <span>{status}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p>
<<<<<<< Updated upstream
                <span className="font-medium">
                  {t("column.memory", "Memory")}:
                </span>{" "}
                {diag.memory_usage}
              </p>
              <p>
                <span className="font-medium">
                  {t("column.goroutines", "Goroutines")}:
                </span>{" "}
                {diag.go_routines}
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
=======
                <span className="font-medium">{t("column.memory", "Memory")}:</span>{" "}
                {diag.memory_usage}
              </p>
              <p>
                <span className="font-medium">{t("column.goroutines", "Goroutines")}:</span>{" "}
                {diag.go_routines}
              </p>
              <p className="text-muted-foreground text-xs mt-1">
>>>>>>> Stashed changes
                {diag.timestamp}
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function ErrorLogPage() {
  const { t } = useTranslation("log");

  const columns: ProTableColumns<API.ErrorLogEntry> = [
    {
      accessorKey: "level",
      header: t("column.level", "Level"),
      cell: ({ row }) => (
        <Badge variant={levelColors[row.original.level] || "default"}>
          {row.original.level}
        </Badge>
      ),
    },
    {
      accessorKey: "message",
      header: t("column.message", "Message"),
      cell: ({ row }) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
<<<<<<< Updated upstream
              <div className="max-w-64 cursor-help truncate">
=======
              <div className="max-w-64 truncate cursor-help">
>>>>>>> Stashed changes
                {row.original.message}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="wrap-break-word max-w-lg">{row.original.message}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
    {
      accessorKey: "error_code",
      header: t("column.code", "Code"),
      cell: ({ row }) => row.original.error_code || "-",
    },
    {
      accessorKey: "method",
      header: t("column.method", "Method"),
      cell: ({ row }) => row.original.method || "-",
    },
    {
      accessorKey: "request_uri",
      header: t("column.uri", "URI"),
      cell: ({ row }) => (
        <div className="max-w-48 truncate text-xs">
          {row.original.request_uri || "-"}
        </div>
      ),
    },
    {
      accessorKey: "client_ip",
      header: t("column.ip", "IP"),
      cell: ({ row }) => row.original.client_ip || "-",
    },
    {
      accessorKey: "timestamp",
      header: t("column.time", "Time"),
      cell: ({ row }) => row.original.timestamp,
    },
  ];

  return (
    <div>
      <DiagnosticPanel />
      <ProTable<API.ErrorLogEntry>
        columns={columns}
        header={{ title: t("title.errorLog", "Error Log") }}
        initialFilters={{}}
        params={[]}
        request={async (pagination) => {
          const { data } = await filterErrorLog({
            page: pagination.page,
            size: pagination.size,
          });
          const list = ((data?.data?.list || []) as API.ErrorLogEntry[]) || [];
          const total = Number(data?.data?.total || list.length);
          return { list, total };
        }}
      />
    </div>
  );
}
