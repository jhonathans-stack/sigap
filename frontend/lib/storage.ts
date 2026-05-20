"use client";

import type { User } from "@/lib/types";

let memoryToken: string | null = null;
let memoryUser: User | null = null;

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function saveSession(token?: string, user?: User) {
  if (token) {
    memoryToken = token;
  }

  if (user) {
    memoryUser = user;
  }

  const storage = getBrowserStorage();

  if (!storage) {
    return;
  }

  if (token) {
    storage.setItem("sigap-token", token);
  }

  if (user) {
    storage.setItem("sigap-user", JSON.stringify(user));
  }
}

export function clearSession() {
  memoryToken = null;
  memoryUser = null;

  const storage = getBrowserStorage();

  if (!storage) {
    return;
  }

  storage.removeItem("sigap-token");
  storage.removeItem("sigap-user");
}

export function getStoredToken() {
  return getBrowserStorage()?.getItem("sigap-token") || memoryToken;
}

export function getStoredUser() {
  const rawUser = getStoredToken() ? getBrowserStorage()?.getItem("sigap-user") : null;

  if (!rawUser) {
    return memoryUser;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    return null;
  }
}

export function canManageItems(user: User | null) {
  return user?.role === "admin" || user?.role === "super";
}

export function canViewUsers(user: User | null) {
  return user?.role === "admin" || user?.role === "super";
}

export function canDeleteUsers(user: User | null) {
  return user?.role === "super";
}
