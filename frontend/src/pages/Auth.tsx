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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { TextHoverEffect } from "@/components/ui/animated-border-text"
import { useTheme } from "@/contexts/ThemeProvider"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { useAuth } from "@/contexts/AuthContext"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { VerificationDialog } from "@/components/VerificationDialog"
import { toast } from "sonner"
import LightRays from "@/components/LightRays"


export function Auth() {
	const {theme} = useTheme();
	const { login, signup, verifyEmail, isAuthenticated, loading: authLoading } = useAuth();
	const navigate = useNavigate();
	const [loading, setLoading] = useState<boolean>(false);
	const [showVerificationDialog, setShowVerificationDialog] = useState<boolean>(false);
	const [verificationError, setVerificationError] = useState<string>("");

	// Redirect authenticated users to home
	useEffect(() => {
		if (!authLoading && isAuthenticated) {
			navigate("/home");
		}
	}, [isAuthenticated, authLoading, navigate]);

	// Signup form state
	const [signupData, setSignupData] = useState({
		teacher_name: "",
		email: "",
		password: "",
		verification_code: ""
	});

	// Login form state
	const [loginData, setLoginData] = useState({
		email: "",
		password: ""
	});

	const handleSignupClick = async (e: React.FormEvent) => {
		e.preventDefault();
		
		// Validate all fields are filled
		if (!signupData.teacher_name.trim() || !signupData.email.trim() || !signupData.password.trim()) {
			toast.error("Please fill in all fields");
			return;
		}
		
		// First, request verification email
		setLoading(true);
		try {
			const result = await verifyEmail({
				email: signupData.email,
				teacher_name: signupData.teacher_name
			});
			
			// Check for error response
			if (result.status && result.status !== 200) {
				throw new Error(result.message);
			}
			
			// Show success message from backend
			const successMessage = result.message || "Verification code sent to your email!";
			toast.success(successMessage);
			setLoading(false);
			// Open verification dialog after successfully sending the code
			setShowVerificationDialog(true);
		} catch (err: any) {
			setLoading(false);
			const errorMessage = err.message || "Failed to send verification code. Please try again.";
			toast.error(errorMessage);
		}
	};

	const handleVerifyAndSignup = async (code: string) => {
		setVerificationError("");
		setLoading(true);
		try {
			const result = await signup({...signupData, verification_code: code});
			
			// Check for error response
			if (result.status && result.status !== 201) {
				throw new Error(result.message);
			}
			
			setShowVerificationDialog(false);
			// Show success message from backend
			const successMessage = result.message || "Account created successfully!";
			toast.success(successMessage);
			// Navigate to home or dashboard after successful signup
			navigate("/home");
		} catch (err: any) {
			const errorMessage = err.message || "Signup failed. Please try again.";
			setVerificationError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		
		// Validate all fields are filled
		if (!loginData.email.trim() || !loginData.password.trim()) {
			toast.error("Please fill in all fields");
			return;
		}
		
		setLoading(true);
		try {
			const result = await login(loginData);
			
			// Check for error response
			if (result.status && result.status !== 200) {
				throw new Error(result.message);
			}
			
			// Show success message from backend
			const successMessage = result.message || "Login successful!";
			toast.success(successMessage);
			// Navigate to home or dashboard after successful login
			navigate("/home");
		} catch (err: any) {
			const errorMessage = err.message || "Login failed. Please try again.";
			toast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	};
  return (
    <>
    {theme === "dark" && 
        <div className="fixed inset-0 z-0">
            <LightRays
                raysOrigin="top-center"
                raysColor={'#fffff'}
                raysSpeed={1}
                lightSpread={1.2}
                rayLength={0.5}
                pulsating={false}
                fadeDistance={1.8}
                saturation={1.6}
                followMouse={true}
                mouseInfluence={0.15}
                noiseAmount={0}
                distortion={0}
            />
        </div>
    }
    <div className="fixed top-4 right-4 z-50">
        <AnimatedThemeToggler/>
    </div>
	{theme === 'dark' && (
	    <div className="fixed inset-0 flex items-center justify-center z-1 pointer-events-none">
			<TextHoverEffect text="SUDAR"/>
		</div>
	)}
    <div className="flex justify-center items-center min-h-screen relative z-10 p-4">
        <div className="flex w-full max-w-md flex-col gap-8 animate-in fade-in duration-500">
            <Tabs defaultValue="signup" className="w-full ">
                <TabsList className="grid w-full grid-cols-2 h-11 glassmorphism">
                    <TabsTrigger value="signup" className="text-sm font-medium">Create Account</TabsTrigger>
                    <TabsTrigger value="login" className="text-sm font-medium">Login</TabsTrigger>
                </TabsList>
                <TabsContent value="signup" className="mt-6">
                    <Card className="w-full border-2 shadow-xl">
                        <CardHeader className="space-y-1 pb-4">
                            <CardTitle className="text-2xl font-bold text-center">Create your account</CardTitle>
                            <CardDescription className="text-center">Enter your details to get started</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <form onSubmit={handleSignupClick}>
                                <div className="flex flex-col gap-4">
                                    <div className="grid gap-2">
                                    <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="John Doe"
                                        className="h-10"
                                        value={signupData.teacher_name}
                                        onChange={(e) => setSignupData({...signupData, teacher_name: e.target.value})}
                                        required={true}
                                    />
                                    </div>
                                    <div className="grid gap-2">
                                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="m@example.com"
                                        className="h-10"
                                        value={signupData.email}
                                        onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                                        required={true}
                                    />
                                    </div>
                                    <div className="grid gap-2">
                                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                                    <Input 
                                        id="password" 
                                        type="password" 
                                        placeholder="••••••••" 
                                        className="h-10" 
                                        value={signupData.password}
                                        onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                                        required={true}
                                    />
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter className="flex-col gap-3 pt-2">
                            <Button type="submit" className="w-full h-10" onClick={handleSignupClick} disabled={loading}>
                                {loading ? "Sending Code..." : "Create Account"}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="login" className="mt-6">
                    <Card className="w-full border-2 shadow-xl">
                        <CardHeader className="space-y-1 pb-4">
                            <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
                            <CardDescription className="text-center">Enter your credentials to continue</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <form onSubmit={handleLogin}>
                            <div className="flex flex-col gap-4">
                                <div className="grid gap-2">
                                <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="m@example.com"
                                    className="h-10"
                                    value={loginData.email}
                                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                                    required={true}
                                />
                                </div>
                                <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                                    <button
                                    onClick={()=>navigate("/forgotpassword")}
                                    className="text-xs hover:underline"
                                    >
                                    Forgot password?
                                    </button>
                                </div>
                                <Input 
                                    id="login-password" 
                                    type="password" 
                                    placeholder="••••••••" 
                                    className="h-10" 
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                                    required ={true}
                                />
                                </div>
                            </div>
                            </form>
                        </CardContent>
                        <CardFooter className="flex-col gap-3 pt-2">
                            <Button type="submit" className="w-full h-10" onClick={handleLogin} disabled={loading}>
                                {loading ? "Logging in..." : "Login"}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    </div>
    
    <VerificationDialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
        onVerify={handleVerifyAndSignup}
        title="Verify Your Email"
        description="Please enter the 6-digit verification code sent to your email."
        loading={loading}
        error={verificationError}
    />
    </>
  )
}

export default Auth;