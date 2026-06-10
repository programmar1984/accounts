"use client";

import { useRouter } from "next/navigation";

export function LangToggle({
  label,
  nextLang,
  className,
}: {
  label: string;
  nextLang: "en" | "ja";
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        document.cookie = `shime_lang=${nextLang};path=/;max-age=31536000;samesite=lax`;
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}
