import { Check, Eye, EyeOff, Trash2, X } from "lucide-react";
import { Button } from "../../ui/Button";

interface BulkActionBarProps {
  selectedCount: number;
  onAction: (action: string) => void;
  onClear: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onAction,
  onClear,
}) => {
  return (
    <div className="alert shadow-lg">
      <div className="flex items-center gap-2">
        <Check className="w-5 h-5" />
        <span>{selectedCount} items selected</span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => onAction("activate")}>
          <Eye className="w-4 h-4 mr-1" />
          Activate
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction("deactivate")}
        >
          <EyeOff className="w-4 h-4 mr-1" />
          Deactivate
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction("delete")}
          className="text-error hover:bg-error/10"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>

        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
};
