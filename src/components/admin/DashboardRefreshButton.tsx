"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardRefreshButton() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1200);
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={refreshing}
      title="Refresh dashboard"
      aria-label="Refresh dashboard data"
      className="flex items-center gap-1.5 text-text-secondary hover:text-navy transition-colors disabled:opacity-40 p-1.5 rounded-sm hover:bg-bg"
    >
      <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
    </button>
  );
}
