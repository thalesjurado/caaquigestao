// lib/sync.ts
import { useEffect } from "react";

export type ServerData = {
  ok: boolean;
  projectId: string;
  ts: number;
};

export type SaveResult = {
  ok: boolean;
  projectId: string;
  saved: unknown;
  ts: number;
};

// Carrega dados do servidor (exemplo; ajuste para sua API/DB)
export async function loadFromServer(projectId: string = "default"): Promise<ServerData> {
  return { ok: true, projectId, ts: Date.now() };
}

// Salva dados no servidor (exemplo)
export async function saveToServer(
  projectId: string = "default",
  payload: unknown = {}
): Promise<SaveResult> {
  return { ok: true, projectId, saved: payload, ts: Date.now() };
}

// Hook: recarrega quando a janela ganha foco
export function useLoadOnFocus(fn: () => void) {
  useEffect(() => {
    const onFocus = () => fn();
    if (typeof window !== "undefined") {
      window.addEventListener("focus", onFocus);
      return () => window.removeEventListener("focus", onFocus);
    }
  }, [fn]);
}