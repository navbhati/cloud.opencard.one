"use client";

import React, { createContext, useContext, useState } from "react";
type EdgeConfigs = Record<string, boolean | string | number>;
const EdgeConfigContext = createContext<EdgeConfigs | null>(null);

export function EdgeConfigProvider({
  initialEdgeConfigs,
  children,
}: {
  initialEdgeConfigs: EdgeConfigs;
  children: React.ReactNode;
}) {
  const [edgeConfigs] = useState(initialEdgeConfigs);
  return (
    <EdgeConfigContext.Provider value={edgeConfigs}>
      {children}
    </EdgeConfigContext.Provider>
  );
}

export function useEdgeConfig<T = boolean>(key: string, fallback?: T): T {
  ``;
  const edgeConfigs = useContext(EdgeConfigContext) ?? {};
  return (edgeConfigs[key] as T) ?? (fallback as T);
}
