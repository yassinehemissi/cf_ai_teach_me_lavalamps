"use client";

import { useSyncExternalStore } from "react";

export function useBrowserReady() {
  return useSyncExternalStore(
    subscribeToBrowserReady,
    getBrowserSnapshot,
    getServerSnapshot,
  );
}

function subscribeToBrowserReady() {
  return () => {};
}

function getBrowserSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}
