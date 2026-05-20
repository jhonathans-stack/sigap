"use client";

import type { User } from "@/lib/types";

export function saveSession(token?: string, user?: User) {
  if (token) {
    window.localStorage.setItem("sigap-token", token);
  }

  if (user) {
    window.localStorage.setItem("sigap-user", JSON.stringify(user));
  }
}

export function clearSession() {
  window.localStorage.removeItem("sigap-token");
  window.localStorage.removeItem("sigap-user");
}

export function getStoredToken() {
  return window.localStorage.getItem("sigap-token");
}

export function getStoredUser() {
  const rawUser = window.localStorage.getItem("sigap-user");

  if (!rawUser) {
    return null;
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
