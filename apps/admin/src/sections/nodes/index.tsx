"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Switch } from "@workspace/ui/components/switch";
import { ConfirmButton } from "@workspace/ui/composed/confirm-button";
import {
  ProTable,
  type ProTableActions,
} from "@workspace/ui/composed/pro-table/pro-table";
import {
  createNode,
  deleteNode,
  filterNodeList,
  resetSortWithNode,
  toggleNodeStatus,
  updateNode,
} from "@workspace/ui/services/admin/server";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useNode } from "@/stores/node";
import { useServer } from "@/stores/server";
import NodeForm from "./node-form";

export default function Nodes() {
  const { t } = useTranslation("nodes");
  const ref = useRef<ProTableActions>(null);
  const [loading, setLoading] = useState(false);

  const { getServerName, getServerAddress, getProtocolPort } = useServer();
  const { fetchNodes, fetchTags, getNodeById } = useNode();

  return (
    <ProTable<API.Node, { search: string }>
      action={ref}
      actions={{
        render: (row) => [
          <NodeForm
            initialValues={row}
            key="edit"
            loading={loading}
            onSubmit={async (values) => {
              setLoading(true);
              try {
                const body: API.UpdateNodeRequest = {
                  ...row,
                  ...values,
                } as any;
                await updateNode(body);
                toast.success(t("updated", "Updated"));
                ref.current?.refresh();
                fetchNodes();
                fetchTags();
                setLoading(false);
                return true;
              } catch {
                setLoading(false);
                return false;
              }
            }}
            title={t("drawerEditTitle", "Edit Node")}
            trigger={t("edit", "Edit")}
          />,
          <ConfirmButton
            cancelText={t("cancel", "Cancel")}
            confirmText={t("confirm", "Confirm")}
            description={t(
              "confirmDeleteDesc",
              "This action cannot be undone."
            )}
            key="delete"
            onConfirm={async () => {
              await deleteNode({ id: row.id } as any);
              toast.success(t("deleted", "Deleted"));
              ref.current?.refresh();
              fetchNodes();
              fetchTags();
            }}
            title={t("confirmDeleteTitle", "Delete this node?")}
            trigger={
              <Button variant="destructive">{t("delete", "Delete")}</Button>
            }
          />,
          <Button
            key="copy"
            onClick={async () => {
              const {
                id: _id,
                sort: _sort,
                enabled: _enabled,
                updated_at: _updated_at,
                created_at: _created_at,
                ...rest
              } = row as any;
              await createNode({
                ...rest,
                enabled: false,
              });
              toast.success(t("copied", "Copied"));
              ref.current?.refresh();
              fetchNodes();
              fetchTags();
            }}
            variant="outline"
          >
            {t("copy", "Copy")}
          </Button>,
        ],
        batchRender(rows) {
          return [
            <ConfirmButton
              cancelText={t("cancel", "Cancel")}
              confirmText={t("confirm", "Confirm")}
              description={t(
                "confirmDeleteDesc",
                "This action cannot be undone."
              )}
              key="delete"
              onConfirm={async () => {
                await Promise.all(
                  rows.map((r) => deleteNode({ id: r.id } as any))
                );
                toast.success(t("deleted", "Deleted"));
                ref.current?.refresh();
                fetchNodes();
                fetchTags();
              }}
              title={t("confirmDeleteTitle", "Delete this node?")}
              trigger={
                <Button variant="destructive">{t("delete", "Delete")}</Button>
              }
            />,
          ];
        },
      }}
      columns={[
        {
          id: "enabled",
          header: t("enabled", "Enabled"),
          cell: ({ row }) => (
            <Switch
              checked={row.original.enabled}
              onCheckedChange={async (v) => {
                await toggleNodeStatus({ id: row.original.id, enable: v });
                toast.success(
                  v ? t("enabled_on", "Enabled") : t("enabled_off", "Disabled")
                );
                ref.current?.refresh();
                fetchNodes();
                fetchTags();
              }}
            />
          ),
        },
        { accessorKey: "name", header: t("name", "Name") },

        {
          id: "address_ports",
          header: `${t("address", "Address")}`,
          cell: ({ row }) => (
            <div className="flex flex-col gap-0.5">
              <span>
                {t("connect_port", "Connect")}
                {": "}
                {row.original.address || "—"}:{row.original.connect_port || "—"}
              </span>
              {row.original.service_port > 0 && (
                <span className="text-muted-foreground text-xs">
                  {t("service_port", "Service")}
                  {": "}
                  {row.original.service_port}
                </span>
              )}
            </div>
          ),
        },

        {
          id: "server_id",
          header: t("server", "Server"),
          cell: ({ row }) =>
            `${getServerName(row.original.server_id)}:${getServerAddress(row.original.server_id)}`,
        },
        {
          id: "protocol",
          header: ` ${t("protocol", "Protocol")}:${t("port", "Port")}`,
          cell: ({ row }) =>
            `${row.original.protocol}:${getProtocolPort(row.original.server_id, row.original.protocol)}`,
        },
        {
          id: "parent_id",
          header: t("parent_node", "Parent"),
          cell: ({ row }) => {
            if (!row.original.parent_id) return "—";
            const parent = getNodeById(row.original.parent_id);
            return parent ? parent.name : `ID:${row.original.parent_id}`;
          },
        },
        {
          accessorKey: "tags",
          header: t("tags", "Tags"),
          cell: ({ row }) => (
            <div className="flex flex-wrap gap-1">
              {(row.original.tags || []).length === 0
                ? "—"
                : row.original.tags.map((tg) => (
                    <Badge key={tg} variant="outline">
                      {tg}
                    </Badge>
                  ))}
            </div>
          ),
        },
      ]}
      header={{
        title: t("pageTitle", "Nodes"),
        toolbar: (
          <NodeForm
            loading={loading}
            onSubmit={async (values) => {
              setLoading(true);
              try {
                const body: API.CreateNodeRequest = {
                  name: values.name,
                  server_id: Number(values.server_id!),
                  protocol: values.protocol,
                  address: values.address,
                  connect_port: Number(values.connect_port!),
                  service_port: Number(values.service_port || 0),
                  parent_id: Number(values.parent_id || 0),
                  tags: values.tags || [],
                  enabled: values.enabled ?? false,
                };
                await createNode(body);
                toast.success(t("created", "Created"));
                ref.current?.refresh();
                fetchNodes();
                fetchTags();
                setLoading(false);
                return true;
              } catch {
                setLoading(false);
                return false;
              }
            }}
            title={t("drawerCreateTitle", "Create Node")}
            trigger={t("create", "Create")}
          />
        ),
      }}
      onSort={async (source, target, items) => {
        const sourceIndex = items.findIndex(
          (item) => String(item.id) === source
        );
        const targetIndex = items.findIndex(
          (item) => String(item.id) === target
        );

        if (sourceIndex === -1 || targetIndex === -1) return items;

        const prevSortById = new Map(items.map((it) => [it.id, it.sort]));

        const next = items.slice();
        const [movedItem] = next.splice(sourceIndex, 1);
        next.splice(targetIndex, 0, movedItem!);

        const numericSorts = items
          .map((it) => (typeof it.sort === "number" ? it.sort : Number.NaN))
          .filter((v) => Number.isFinite(v)) as number[];
        const baseSort = numericSorts.length ? Math.min(...numericSorts) : 0;

        const updatedItems = next.map((item, index) => ({
          ...item,
          sort: baseSort + index,
        }));

        const changedItems = updatedItems.filter(
          (item) => item.sort !== prevSortById.get(item.id)
        );

        if (changedItems.length > 0) {
          await resetSortWithNode({
            sort: changedItems.map((item) => ({
              id: item.id,
              sort: item.sort,
            })) as API.SortItem[],
          });
          toast.success(t("sorted_success", "Sorted successfully"));
        }

        return updatedItems;
      }}
      params={[{ key: "search" }]}
      request={async (pagination, filter) => {
        const { data } = await filterNodeList({
          page: pagination.page,
          size: pagination.size,
          search: filter?.search || undefined,
        });
        const rawList = (data?.data?.list || []) as API.Node[];
        const list = rawList.slice().sort((a, b) => {
          const as = a.sort;
          const bs = b.sort;
          const an = typeof as === "number" ? as : Number.POSITIVE_INFINITY;
          const bn = typeof bs === "number" ? bs : Number.POSITIVE_INFINITY;
          if (an !== bn) return an - bn;
          return Number(a.id) - Number(b.id);
        });
        const total = Number(data?.data?.total || list.length);
        return { list, total };
      }}
    />
  );
}
