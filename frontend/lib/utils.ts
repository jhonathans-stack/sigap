import { API_BASE_URL } from "@/lib/api";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function getItemImageUrl(imageUrl?: string | null) {
  if (!imageUrl) {
    return null;
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/uploads")) {
    return `${API_BASE_URL}${imageUrl}`;
  }

  return imageUrl;
}

export function getItemImageUrls(imageUrls?: Array<string | null> | null, fallback?: string | null) {
  const urls = [...(imageUrls || []), fallback]
    .map((url) => getItemImageUrl(url))
    .filter(Boolean) as string[];

  return Array.from(new Set(urls));
}

export function formatDate(date?: string | null) {
  if (!date) {
    return "Nao informado";
  }

  const onlyDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (onlyDate) {
    return `${onlyDate[3]}/${onlyDate[2]}/${onlyDate[1]}`;
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short"
  }).format(parsedDate);
}

export function formatDateTime(date?: string | null) {
  if (!date) {
    return "Nao informado";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(parsedDate);
}

export function normalizeCpf(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function formatCpf(value: string) {
  const digits = normalizeCpf(value);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
