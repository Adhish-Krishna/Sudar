import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CreateEditDialogueProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit: () => void;
  onCancel?: () => void;
  mode: "create" | "edit";
  loading?: boolean;
  submitButtonText?: string;
  cancelButtonText?: string;
}

export const CreateEditDialogue: React.FC<CreateEditDialogueProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  onCancel,
  mode,
  loading = false,
  submitButtonText,
  cancelButtonText,
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  const handleSubmit = () => {
    onSubmit();
  };

  const defaultSubmitText = mode === "create" ? "Create" : "Update";
  const defaultCancelText = "Cancel";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="py-4">
          {children}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelButtonText || defaultCancelText}
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (mode === "create" ? "Creating..." : "Updating...") : (submitButtonText || defaultSubmitText)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditDialogue;
