"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import { Combobox } from "@workspace/ui/composed/combobox";
import { EnhancedInput } from "@workspace/ui/composed/enhanced-input";
import TagInput from "@workspace/ui/composed/tag-input";
import type { TFunction } from "i18next";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { useNode } from "@/stores/node";
import { useServer } from "@/stores/server";

export type ProtocolName =
  | "shadowsocks"
  | "vmess"
  | "vless"
  | "trojan"
  | "hysteria"
  | "tuic"
  | "anytls"
  | "naive"
  | "http"
  | "socks"
  | "mieru";

const buildSchema = (t: TFunction) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, t("errors.nameRequired", "Please enter a name")),
    server_id: z
      .number({ message: t("errors.serverRequired", "Please select a server") })
      .int()
      .gt(0, t("errors.serverRequired", "Please select a server"))
      .optional(),
    protocol: z
      .string()
      .min(1, t("errors.protocolRequired", "Please select a protocol")),
    address: z
      .string()
      .trim()
      .min(1, t("errors.serverAddrRequired", "Please enter an entry address")),
    connect_port: z
      .number({
        message: t("errors.portRange", "Port must be between 1 and 65535"),
      })
      .int()
      .min(1, t("errors.portRange", "Port must be between 1 and 65535"))
      .max(65_535, t("errors.portRange", "Port must be between 1 and 65535")),
    service_port: z
      .number({
        message: t("errors.portRange", "Port must be between 1 and 65535"),
      })
      .int()
      .min(0)
      .max(65_535, t("errors.portRange", "Port must be between 1 and 65535"))
      .optional(),
    parent_id: z.number().int().min(0).optional(),
    enabled: z.boolean().optional(),
    tags: z.array(z.string()),
  });

export type NodeFormValues = z.infer<ReturnType<typeof buildSchema>>;

function normalizeValues(v?: Partial<NodeFormValues>): Partial<NodeFormValues> {
  if (!v) return {};
  return { ...v, tags: Array.isArray(v.tags) ? v.tags : [] };
}

export default function NodeForm(props: {
  trigger: string;
  title: string;
  loading?: boolean;
  initialValues?: Partial<NodeFormValues & { id?: number }>;
  onSubmit: (values: NodeFormValues) => Promise<boolean> | boolean;
}) {
  const { trigger, title, loading, initialValues, onSubmit } = props;
  const { t } = useTranslation("nodes");
  const Scheme = useMemo(() => buildSchema(t), [t]);
  const [open, setOpen] = useState(false);

  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(
    new Set()
  );

  const removeAutoFilledField = (fieldName: string) => {
    setAutoFilledFields((prev) => {
      const newSet = new Set(prev);
      newSet.delete(fieldName);
      return newSet;
    });
  };

  const form = useForm<NodeFormValues, any, NodeFormValues>({
    resolver: zodResolver(Scheme),
    defaultValues: {
      name: "",
      server_id: undefined,
      protocol: "",
      address: "",
      connect_port: 0,
      service_port: 0,
      parent_id: undefined,
      enabled: false,
      tags: [],
      ...normalizeValues(initialValues),
    },
  });

  const serverId = form.watch("server_id");

  const { servers, getAvailableProtocols } = useServer();
  const { nodes, tags } = useNode();

  const existingTags: string[] = tags || [];

  const availableProtocols = getAvailableProtocols(serverId);

  const parentNodeOptions = nodes
    .filter((n) => !initialValues?.id || n.id !== (initialValues.id as number))
    .map((n) => ({
      value: n.id,
      label: `${n.name} (${n.address}:${n.connect_port})`,
    }));

  useEffect(() => {
    if (initialValues) {
      form.reset({
        name: "",
        server_id: undefined,
        protocol: "",
        address: "",
        connect_port: 0,
        service_port: 0,
        parent_id: undefined,
        enabled: false,
        tags: [],
        ...normalizeValues(initialValues),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  function handleServerChange(nextId?: number | null) {
    const id = nextId ?? undefined;
    form.setValue("server_id", id);

    if (!id) {
      setAutoFilledFields(new Set());
      return;
    }

    const selectedServer = servers.find((s) => s.id === id);
    if (!selectedServer) return;

    const currentValues = form.getValues();
    const fieldsToFill: string[] = [];

    if (!currentValues.name || autoFilledFields.has("name")) {
      form.setValue("name", selectedServer.name as string, {
        shouldDirty: false,
      });
      fieldsToFill.push("name");
    }

    if (!currentValues.address || autoFilledFields.has("address")) {
      form.setValue("address", selectedServer.address as string, {
        shouldDirty: false,
      });
      fieldsToFill.push("address");
    }

    const protocols = getAvailableProtocols(id);
    const firstProtocol = protocols[0];

    if (
      firstProtocol &&
      (!currentValues.protocol || autoFilledFields.has("protocol"))
    ) {
      form.setValue("protocol", firstProtocol.protocol, { shouldDirty: false });
      fieldsToFill.push("protocol");
    }

    setAutoFilledFields(new Set(fieldsToFill));
  }

  const handleManualFieldChange = (
    fieldName: keyof NodeFormValues,
    value: any
  ) => {
    form.setValue(fieldName, value);
    removeAutoFilledField(fieldName);
  };

  async function handleSubmit(values: NodeFormValues) {
    const result = await onSubmit(values);
    if (result) {
      setOpen(false);
      setAutoFilledFields(new Set());
    }
  }

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button
          onClick={() => {
            form.reset({
              name: "",
              server_id: undefined,
              protocol: "",
              address: "",
              connect_port: 0,
              service_port: 0,
              parent_id: undefined,
              enabled: false,
              tags: [],
              ...normalizeValues(initialValues),
            });
            setAutoFilledFields(new Set());
          }}
        >
          {trigger}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[560px] max-w-full">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100dvh-48px-36px-36px-env(safe-area-inset-top))] px-6 pt-4">
          <Form {...form}>
            <form className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="server_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("server", "Server")}</FormLabel>
                    <FormControl>
                      <Combobox<number, false>
                        creatable
                        creatableParser={(v) => Number.parseInt(v, 10) || 0}
                        onChange={(v) => handleServerChange(v)}
                        options={servers.map((s) => ({
                          value: s.id,
                          label: `${s.name} (${(s.address as any) || ""})`,
                        }))}
                        placeholder={t("select_server", "Select server…")}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="protocol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("protocol", "Protocol")}</FormLabel>
                    <FormControl>
                      <Combobox<string, false>
                        onChange={(v) =>
                          handleManualFieldChange(
                            "protocol",
                            (v as ProtocolName) || ""
                          )
                        }
                        options={availableProtocols.map((p) => ({
                          value: p.protocol,
                          label: `${p.protocol}${p.port ? ` (${p.port})` : ""}`,
                        }))}
                        placeholder={t("select_protocol", "Select protocol…")}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name", "Name")}</FormLabel>
                    <FormControl>
                      <EnhancedInput
                        {...field}
                        onValueChange={(v) =>
                          handleManualFieldChange("name", v as string)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("address", "Address")}</FormLabel>
                    <FormControl>
                      <EnhancedInput
                        {...field}
                        onValueChange={(v) =>
                          handleManualFieldChange("address", v as string)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="connect_port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("connect_port", "Connect Port")}</FormLabel>
                    <FormControl>
                      <EnhancedInput
                        {...field}
                        max={65_535}
                        min={1}
                        onValueChange={(v) =>
                          handleManualFieldChange("connect_port", Number(v))
                        }
                        placeholder="1-65535"
                        type="number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="service_port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("service_port", "Service Port")}</FormLabel>
                    <FormControl>
                      <EnhancedInput
                        {...field}
                        max={65_535}
                        min={0}
                        onValueChange={(v) =>
                          handleManualFieldChange("service_port", Number(v))
                        }
                        placeholder="0-65535"
                        type="number"
                      />
                    </FormControl>
                    <FormDescription>
                      {t(
                        "service_port_description",
                        "Internal forwarding service port. Leave 0 if unused."
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("parent_node", "Parent Node")}</FormLabel>
                    <FormControl>
                      <Combobox<number, false>
                        onChange={(v) =>
                          handleManualFieldChange("parent_id", v ?? 0)
                        }
                        options={[
                          { value: 0, label: t("none", "None") },
                          ...parentNodeOptions,
                        ]}
                        placeholder={t(
                          "select_parent_node",
                          "Select parent node…"
                        )}
                        value={field.value}
                      />
                    </FormControl>
                    <FormDescription>
                      {t(
                        "parent_node_description",
                        "Forward traffic to this parent node."
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>{t("enabled", "Enabled")}</FormLabel>
                      <FormDescription>
                        {t(
                          "enabled_description",
                          "Enable this node for user subscriptions."
                        )}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tags", "Tags")}</FormLabel>
                    <FormControl>
                      <TagInput
                        onChange={(v) => form.setValue(field.name, v)}
                        options={existingTags}
                        placeholder={t(
                          "tags_placeholder",
                          "Use Enter or comma (,) to add multiple tags"
                        )}
                        value={field.value || []}
                      />
                    </FormControl>
                    <FormDescription>
                      {t(
                        "tags_description",
                        "Permission grouping tag (incl. plan binding and delivery policies)."
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ScrollArea>

        <SheetFooter className="flex-row justify-end gap-2 pt-3">
          <Button
            disabled={loading}
            onClick={() => setOpen(false)}
            variant="outline"
          >
            {t("cancel", "Cancel")}
          </Button>
          <Button
            disabled={loading}
            onClick={form.handleSubmit(handleSubmit, (errors) => {
              const key = Object.keys(errors)[0] as keyof typeof errors;
              if (key) toast.error(String(errors[key]?.message));
              return false;
            })}
          >
            {t("confirm", "Confirm")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
