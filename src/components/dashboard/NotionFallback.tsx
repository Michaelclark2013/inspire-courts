import { Database, AlertCircle } from "lucide-react";

interface NotionFallbackProps {
  type: "no-key" | "empty";
  entityName: string;
}

export default function NotionFallback({ type, entityName }: NotionFallbackProps) {
  if (type === "no-key") {
    return (
      <div className="bg-bg-secondary border border-border rounded-sm p-8 text-center">
        <Database className="w-10 h-10 text-accent mx-auto mb-4" />
        <h3 className="text-white font-bold text-lg uppercase tracking-tight mb-2">
          Connect Your Notion Databases
        </h3>
        <p className="text-text-secondary text-sm max-w-lg mx-auto mb-4">
          Add your <code className="text-accent">NOTION_API_KEY</code> to your
          environment variables to see live {entityName} data from your Notion workspace.
        </p>
        <p className="text-text-secondary text-xs">
          See <code className="text-accent">.env.example</code> for all required variables.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-sm p-8 text-center">
      <AlertCircle className="w-10 h-10 text-text-secondary mx-auto mb-4" />
      <h3 className="text-white font-bold text-lg uppercase tracking-tight mb-2">
        No {entityName} Yet
      </h3>
      <p className="text-text-secondary text-sm max-w-lg mx-auto">
        {entityName.charAt(0).toUpperCase() + entityName.slice(1)} will appear here once they are added to your Notion database.
      </p>
    </div>
  );
}
