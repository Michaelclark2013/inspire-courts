import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-white/[0.04] rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-text-secondary" />
        </div>
        <h2 className="text-navy font-bold text-xl mb-2">Page Not Found</h2>
        <p className="text-text-secondary text-sm mb-6">
          This admin page doesn&apos;t exist or may have been moved.
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
