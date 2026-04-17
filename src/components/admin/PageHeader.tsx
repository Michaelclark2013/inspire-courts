import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

/**
 * Consistent page header pattern for admin pages.
 * Renders a large bold title, optional subtitle, and optional action button.
 */
export default function PageHeader({ title, subtitle, icon: Icon, action }: PageHeaderProps) {
  return (
    <div className="mb-4 md:mb-8 flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="hidden md:flex w-10 h-10 bg-red/10 rounded-xl items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-red" />
          </div>
        )}
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            {title}
          </h1>
          {subtitle && (
            <p className="text-text-secondary text-sm mt-0.5 hidden md:block">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
