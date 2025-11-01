import { TextHoverEffect } from "@/components/ui/animated-border-text"
import { useTheme } from "@/contexts/ThemeProvider"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { VerificationDialog } from "@/components/VerificationDialog"
import { toast } from "sonner"

const ForgotPassword = ()=>{
    const {theme} = useTheme();
    const { forgotPassword, resetPassword, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordMismatch, setPasswordMismatch] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [showTokenDialog, setShowTokenDialog] = useState(false);
    const [tokenError, setTokenError] = useState("");

    // Redirect authenticated users to home
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            navigate("/home");
        }
    }, [isAuthenticated, authLoading, navigate]);

    const handleResetClick = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Validate all fields are filled
        if (!email.trim() || !newPassword.trim() || !confirmPassword.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            toast.error("Passwords do not match");
            return;
        }

        // Validate password length
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long");
            toast.error("Password must be at least 8 characters long");
            return;
        }

        // First, call forgotPassword to send the reset code
        setLoading(true);
        try {
            const result = await forgotPassword({ email });
            
            // Check for error response
            if (result.status && result.status !== 200) {
                throw new Error(result.message);
            }
            
            // Show success message from backend
            const successMessage = result.message || "Reset code sent to your email!";
            toast.success(successMessage);
            setLoading(false);
            // Open token dialog after successfully sending the code
            setShowTokenDialog(true);
        } catch (err: any) {
            setLoading(false);
            const errorMessage = err.message || "Failed to send reset code. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    const handleVerifyAndReset = async (token: string) => {
        setTokenError("");
        setLoading(true);
        try {
            const result = await resetPassword({
                email,
                code: token,
                new_password: newPassword
            });
            
            // Check for error response
            if (result.status && result.status !== 200) {
                throw new Error(result.message);
            }
            
            setShowTokenDialog(false);
            // Show success message from backend
            const successMessage = result.message || "Password reset successful!";
            toast.success(successMessage);
            setSuccess(successMessage + " Redirecting to login...");
            setTimeout(() => {
                navigate("/auth");
            }, 2000);
        } catch (err: any) {
            const errorMessage = err.message || "Password reset failed. Please try again.";
            setTokenError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return(
        <>
            <div className="fixed top-4 right-4 z-50">
                <AnimatedThemeToggler/>
            </div>
            {theme === 'dark' && (
                <div className="fixed inset-0 flex items-center justify-center z-0 pointer-events-none">
                    <TextHoverEffect text="SUDAR"/>
                </div>
            )}
            
            <div className="flex justify-center items-center min-h-screen relative z-10 p-4">
                <div className="flex w-full max-w-md flex-col gap-8 animate-in fade-in duration-500">
                    <Card className="w-full border-2 shadow-xl">
                        <CardHeader className="space-y-1 pb-4">
                            <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
                            <CardDescription className="text-center">
                                Enter your email and new password to reset your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <form onSubmit={handleResetClick}>
                                <div className="flex flex-col gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="m@example.com"
                                            className="h-10"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="h-10"
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value);
                                                // Check if passwords match when new password changes
                                                if (confirmPassword && e.target.value !== confirmPassword) {
                                                    setPasswordMismatch(true);
                                                } else {
                                                    setPasswordMismatch(false);
                                                }
                                            }}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm New Password</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            placeholder="••••••••"
                                            className={`h-10 ${passwordMismatch ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value);
                                                // Check if passwords match
                                                if (newPassword && e.target.value !== newPassword) {
                                                    setPasswordMismatch(true);
                                                } else {
                                                    setPasswordMismatch(false);
                                                }
                                            }}
                                            required
                                        />
                                        {passwordMismatch && confirmPassword && (
                                            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter className="flex-col gap-3 pt-2">
                            <Button type="submit" className="w-full h-10" onClick={handleResetClick} disabled={loading}>
                                {loading ? "Sending Code..." : "Reset Password"}
                            </Button>
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="w-full h-10" 
                                onClick={() => navigate("/auth")}
                            >
                                Back to Login
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
            
            <VerificationDialog
                open={showTokenDialog}
                onOpenChange={setShowTokenDialog}
                onVerify={handleVerifyAndReset}
                title="Enter Reset Token"
                description="Please enter the 6-digit reset token sent to your email."
                loading={loading}
                error={tokenError}
            />
        </>
    )
}

export default ForgotPassword;