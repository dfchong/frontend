import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
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
import { Input } from "@workspace/ui/components/input";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { Icon } from "@workspace/ui/composed/icon";
import {
  getCorsConfig,
  syncCorsConfig,
  updateCorsConfig,
} from "@workspace/ui/services/admin/system";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

const corsSchema = z.object({
  origins: z.array(
    z.object({
      origin: z
        .string()
        .min(1)
        .refine(
          (val) => {
            if (val === "*") return true;
            return /^https?:\/\/.+/.test(val);
          },
          { message: "Must be a valid URL (https://...) or * for all origins" }
        ),
    })
  ),
});

type CorsFormData = z.infer<typeof corsSchema>;

export default function CorsConfig() {
  const { t } = useTranslation("system");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ["getCorsConfig"],
    queryFn: async () => {
      const { data } = await getCorsConfig();
      return data.data;
    },
    enabled: open,
  });

  const form = useForm<CorsFormData>({
    resolver: zodResolver(corsSchema),
    defaultValues: {
      origins: [{ origin: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "origins",
  });

  useEffect(() => {
    if (data) {
      const origins = (data.origins || []).map((o: string) => ({
        origin: o,
      }));
      form.reset({ origins: origins.length > 0 ? origins : [{ origin: "" }] });
    }
  }, [data, form]);

  async function onSubmit(values: CorsFormData) {
    setLoading(true);
    try {
      const origins = values.origins
        .map((item) => item.origin.trim())
        .filter((item) => item !== "");
      await updateCorsConfig({ origins });
      toast.success(t("common.saveSuccess", "Save Successful"));
      refetch();
      setOpen(false);
    } catch (_error) {
      toast.error(t("common.saveFailed", "Save Failed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await syncCorsConfig();
      toast.success(t("cors.syncSuccess", "Cache synced from database"));
      refetch();
    } catch (_error) {
      toast.error(t("cors.syncFailed", "Cache sync failed"));
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <div className="flex cursor-pointer items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" icon="mdi:shield-key" />
            </div>
            <div className="flex-1">
              <p className="font-medium">
                {t("cors.title", "CORS Configuration")}
              </p>
              <p className="text-muted-foreground text-sm">
                {t(
                  "cors.description",
                  "Manage allowed cross-origin domains. Leave empty (or use *) to allow all origins."
                )}
              </p>
            </div>
          </div>
          <Icon className="size-6" icon="mdi:chevron-right" />
        </div>
      </SheetTrigger>
      <SheetContent className="w-[600px] max-w-full gap-0 md:max-w-screen-md">
        <SheetHeader>
          <SheetTitle>{t("cors.title", "CORS Configuration")}</SheetTitle>
          <SheetDescription>
            {t("cors.description", "Manage allowed cross-origin domains.")}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100dvh-48px-36px-36px-24px-env(safe-area-inset-top))] px-6">
          <Form {...form}>
            <form
              className="space-y-4 pt-4"
              id="cors-form"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormDescription className="!mt-0">
                {t(
                  "cors.formDescription",
                  "Add the full origin URL for each domain that should be allowed to access the API. Use * to allow all origins (not recommended for production)."
                )}
              </FormDescription>

              {fields.map((field, index) => (
                <FormField
                  control={form.control}
                  key={field.id}
                  name={`origins.${index}.origin`}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {index === 0
                          ? t("cors.allowedOrigins", "Allowed Origins")
                          : `Origin #${index + 1}`}
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="https://example.com"
                            {...formField}
                          />
                        </FormControl>
                        {fields.length > 1 && (
                          <Button
                            onClick={() => remove(index)}
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <Icon
                              className="h-4 w-4 text-destructive"
                              icon="mdi:delete"
                            />
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <Button
                className="w-full"
                onClick={() => append({ origin: "" })}
                type="button"
                variant="outline"
              >
                <Icon className="mr-2 h-4 w-4" icon="mdi:plus" />
                {t("cors.addOrigin", "Add Origin")}
              </Button>
            </form>
          </Form>
        </ScrollArea>
        <SheetFooter className="flex-row justify-end gap-2 pt-3">
          <Button
            disabled={loading || syncing}
            onClick={handleSync}
            variant="secondary"
          >
            {syncing && (
              <Icon className="mr-2 animate-spin" icon="mdi:loading" />
            )}
            <Icon className="mr-2 h-4 w-4" icon="mdi:sync" />
            {t("cors.syncCache", "Sync Cache")}
          </Button>
          <Button
            disabled={loading}
            onClick={() => setOpen(false)}
            variant="outline"
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button disabled={loading} form="cors-form" type="submit">
            {loading && (
              <Icon className="mr-2 animate-spin" icon="mdi:loading" />
            )}
            {t("common.save", "Save Settings")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
