import { SkeletonGrid } from "@/components/ui/SkeletonCard";

export default function TournamentsLoading() {
  return (
    <div className="pt-24 lg:pt-28">
      {/* Hero skeleton */}
      <div className="min-h-[60vh] bg-navy flex items-center justify-center">
        <div className="text-center space-y-4 animate-pulse">
          <div className="h-5 w-36 bg-white/20 rounded-full mx-auto" />
          <div className="h-14 w-80 bg-white/20 rounded mx-auto" />
          <div className="h-5 w-96 bg-white/10 rounded mx-auto" />
          <div className="h-12 w-44 bg-red/60 rounded-full mx-auto mt-4" />
        </div>
      </div>

      {/* Tournaments grid skeleton */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center animate-pulse">
            <div className="h-3 w-28 bg-light-gray rounded mx-auto mb-4" />
            <div className="h-10 w-72 bg-light-gray rounded mx-auto mb-4" />
            <div className="h-4 w-80 bg-light-gray rounded mx-auto" />
          </div>
          <SkeletonGrid count={3} />
        </div>
      </div>
    </div>
  );
}
