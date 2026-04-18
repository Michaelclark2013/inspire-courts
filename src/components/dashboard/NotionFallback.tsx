import { Database, AlertCircle } from "lucide-react";

interface NotionFallbackProps {
  type: "no-key" | "empty";
  entityName: string;
}

export default function NotionFallback({ type, entityName }: NotionFallbackProps) {
  if (type === "no-key") {
    return (
      <div className="bg-off-white border border-light-gray rounded-xl p-10 text-center">
        <div className="w-14 h-14 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-5">
          <Database className="w-7 h-7 text-red" aria-hidden="true" />
        </div>
        <h3 className="text-navy font-bold text-lg uppercase tracking-tight mb-2 font-heading">
          Connect Your Notion Databases
        </h3>
        <p className="text-text-muted text-sm max-w-lg mx-auto mb-5 leading-relaxed">
          Add your <code className="text-red font-semibold bg-red/5 px-1.5 py-0.5 rounded">NOTION_API_KEY</code> to your
          environment variables to see live {entityName} data from your Notion workspace.
        </p>
        <p className="text-text-muted text-xs">
          See <code className="text-red font-semibold bg-red/5 px-1.5 py-0.5 rounded">.env.example</code> for all required variables.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-off-white border border-light-gray rounded-xl p-10 text-center">
      <div className="w-14 h-14 bg-navy/5 rounded-full flex items-center justify-center mx-auto mb-5">
        <AlertCircle className="w-7 h-7 text-navy/40" aria-hidden="true" />
      </div>
      <h3 className="text-navy font-bold text-lg uppercase tracking-tight mb-2 font-heading">
        No {entityName} Yet
      </h3>
      <p className="text-text-muted text-sm max-w-lg mx-auto leading-relaxed">
        {entityName.charAt(0).toUpperCase() + entityName.slice(1)} will appear here once they are added to your Notion database.
      </p>
    </div>
  );
}
