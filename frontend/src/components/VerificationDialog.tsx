import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (code: string) => void;
  title: string;
  description: string;
  loading?: boolean;
  error?: string;
}

export function VerificationDialog({
  open,
  onOpenChange,
  onVerify,
  title,
  description,
  loading = false,
  error = "",
}: VerificationDialogProps) {
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify(code);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="text-sm text-red-500 text-center p-2 bg-red-50 dark:bg-red-950/20 rounded">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="verification-code" className="text-sm font-medium">
                Enter Code
              </Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="Enter 6-digit code"
                className="h-10"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                pattern="[0-9]{6}"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
