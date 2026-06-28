"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";

const MAX_IMAGE_DIM = 1280;

async function resizeReceiptImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width <= MAX_IMAGE_DIM && bitmap.height <= MAX_IMAGE_DIM) {
      return file;
    }

    const scale = MAX_IMAGE_DIM / Math.max(bitmap.width, bitmap.height);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85)
    );
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "receipt";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}

export function ReceiptScanForm({
  action,
  title,
  hint,
  preparingLabel,
  scanningLabel,
  scanningHint,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  title: string;
  hint: string;
  preparingLabel: string;
  scanningLabel: string;
  scanningHint: string;
  submitLabel: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const busy = preparing || isPending;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    let prepared = file;
    if (file.type.startsWith("image/") && file.type !== "image/gif") {
      setPreparing(true);
      try {
        prepared = await resizeReceiptImage(file);
      } finally {
        setPreparing(false);
      }
    }

    const formData = new FormData();
    formData.append("receipt", prepared);

    startTransition(() => {
      void action(formData);
    });
  }

  let buttonLabel = submitLabel;
  if (preparing) buttonLabel = preparingLabel;
  else if (isPending) buttonLabel = scanningLabel;

  return (
    <form className="stack" onSubmit={handleSubmit}>
      {preparing && <Alert variant="info">{preparingLabel}</Alert>}
      {isPending && !preparing && <Alert variant="info">{scanningHint}</Alert>}
      <h2 className="section-title">{title}</h2>
      <p className="muted">{hint}</p>
      <div className="form-group">
        <input
          ref={fileRef}
          name="receipt"
          type="file"
          accept="image/*,application/pdf"
          required
          className="input"
          disabled={busy}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={busy} aria-busy={busy}>
        {buttonLabel}
      </button>
    </form>
  );
}
