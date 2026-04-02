import { useEffect, useState } from "react";

interface AdminImagePreviewProps {
  src?: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  fallbackLabel?: string;
}

export function AdminImagePreview({
  src,
  alt,
  className,
  imageClassName,
  fallbackLabel = "Gorsel yok",
}: AdminImagePreviewProps) {
  const normalizedSrc = src?.trim() ?? "";
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [normalizedSrc]);

  const wrapperClassName = className
    ? className
    : "h-32 w-full rounded-md border border-border bg-muted/20";
  const imgClass = imageClassName ? imageClassName : "h-full w-full object-contain";

  if (!normalizedSrc || hasError) {
    return (
      <div className={wrapperClassName}>
        <div className="flex h-full w-full items-center justify-center rounded-md bg-muted/40 px-2 text-center text-xs text-muted-foreground">
          {fallbackLabel}
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClassName}>
      <img
        src={normalizedSrc}
        alt={alt}
        className={imgClass}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
