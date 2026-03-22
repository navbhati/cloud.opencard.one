"use client";

import { useState, useEffect, useMemo } from "react";
import { Globe, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  getTimezoneOptions,
  formatTimezoneDisplay,
  getUserTimezone,
} from "@/lib/late/timezones";
import LoadingScreen from "@/components/LoadingScreen";

export default function GeneralSettingsPage() {
  const [timezone, setTimezone] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const timezoneOptions = useMemo(
    () => getTimezoneOptions(timezone),
    [timezone],
  );

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const res = await fetch("/api/preferences");
        if (res.ok) {
          const data = await res.json();
          setTimezone(
            data.preferences?.timezone || getUserTimezone(),
          );
        } else {
          setTimezone(getUserTimezone());
        }
      } catch {
        setTimezone(getUserTimezone());
      } finally {
        setLoading(false);
      }
    }
    fetchPreferences();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Timezone updated successfully.");
    } catch {
      toast.error("Failed to save timezone. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-medium tracking-tight">General</h1>
          <p className="text-sm text-muted-foreground">
            Manage your general preferences.
          </p>
        </div>

        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-medium">Timezone</h3>
              <p className="text-xs text-muted-foreground">
                Used for scheduling social media posts and calendar display.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full sm:w-[340px] justify-between font-normal cursor-pointer"
                >
                  {timezone
                    ? formatTimezoneDisplay(timezone)
                    : "Select timezone..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[340px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search timezone..." />
                  <CommandList>
                    <CommandEmpty>No timezone found.</CommandEmpty>
                    <CommandGroup>
                      {timezoneOptions.map((tz) => (
                        <CommandItem
                          key={tz}
                          value={formatTimezoneDisplay(tz)}
                          onSelect={() => {
                            setTimezone(tz);
                            setOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              timezone === tz
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {formatTimezoneDisplay(tz)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="cursor-pointer"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Browser detected: {getUserTimezone()}
          </p>
        </div>
      </div>
    </div>
  );
}
