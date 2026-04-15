interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  dark?: boolean;
  titleId?: string;
}

export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  dark = false,
  titleId,
}: SectionHeaderProps) {
  const alignClass = align === "center" ? "text-center" : "text-left";
  return (
    <div className={`${alignClass} mb-8 md:mb-12 lg:mb-16`}>
      {eyebrow && (
        <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-3 font-[var(--font-chakra)]">
          {eyebrow}
        </p>
      )}
      <h2
        id={titleId}
        className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight font-[var(--font-chakra)] ${
          dark ? "text-white" : "text-navy"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-3 text-base md:text-lg max-w-2xl leading-relaxed ${
            align === "center" ? "mx-auto" : ""
          } ${dark ? "text-white/70" : "text-text-muted"}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
