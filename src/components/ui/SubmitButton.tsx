import { ArrowRight, Loader2 } from "lucide-react";

interface SubmitButtonProps {
  loading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export default function SubmitButton({
  loading,
  loadingText = "Submitting...",
  children,
  fullWidth = false,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className={`${
        fullWidth ? "w-full" : "w-full sm:w-auto"
      } inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors font-[var(--font-chakra)] shadow-sm`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          {loadingText}
        </>
      ) : (
        <>
          {children}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </>
      )}
    </button>
  );
}
