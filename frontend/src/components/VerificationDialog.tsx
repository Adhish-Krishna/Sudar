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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

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
        <form onSubmit={handleSubmit} className="flex justify-center items-center flex-col">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(value) => setCode(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="h-10 w-10"/>
                  <InputOTPSlot index={1} className="h-10 w-10" />
                  <InputOTPSlot index={2} className="h-10 w-10" />
                  <InputOTPSlot index={3} className="h-10 w-10" />
                  <InputOTPSlot index={4} className="h-10 w-10" />
                  <InputOTPSlot index={5}className="h-10 w-10" />
                </InputOTPGroup>
              </InputOTP>
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
