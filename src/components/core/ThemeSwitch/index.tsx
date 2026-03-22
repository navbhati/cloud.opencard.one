"use client";

import { useTheme } from "next-themes";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait for component to mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Tabs value={theme} onValueChange={(value) => setTheme(value)}>
      <TabsList>
        <TabsTrigger value="light" className="cursor-pointer">
          <Sun className="h-5 w-5" />
        </TabsTrigger>
        <TabsTrigger value="dark" className="cursor-pointer">
          <Moon className="h-5 w-5" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
