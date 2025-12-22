import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User } from "lucide-react";
import { performance, type StudentResponse, type PerformanceResponse } from "@/api";
import { toast } from "sonner";

interface FeedbackDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: StudentResponse | null;
    activityId: string;
    existingPerformance: PerformanceResponse | null;
    onSuccess: () => void;
}

const FeedbackDialog = ({
    open,
    onOpenChange,
    student,
    activityId,
    existingPerformance,
    onSuccess,
}: FeedbackDialogProps) => {
    const [mark, setMark] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const isEditing = !!existingPerformance;

    // Reset form when dialog opens with existing data
    useEffect(() => {
        if (open && existingPerformance) {
            setMark(existingPerformance.teacher_mark.toString());
            setFeedback(existingPerformance.teacher_feedback || "");
        } else if (open) {
            setMark("");
            setFeedback("");
        }
    }, [open, existingPerformance]);

    const handleSubmit = async () => {
        if (!student) return;

        const markValue = parseInt(mark, 10);
        if (isNaN(markValue) || markValue < 0 || markValue > 100) {
            toast.error("Please enter a valid mark between 0 and 100");
            return;
        }

        setIsLoading(true);
        try {
            let response;

            if (isEditing) {
                // Update existing performance
                response = await performance.updatePerformance(
                    student.rollno,
                    activityId,
                    {
                        teacher_mark: markValue,
                        teacher_feedback: feedback.trim() || undefined,
                    }
                );
            } else {
                // Create new performance
                response = await performance.createPerformance({
                    student_rollno: student.rollno,
                    activity_id: activityId,
                    teacher_mark: markValue,
                    teacher_feedback: feedback.trim() || undefined,
                });
            }

            if (response.status && response.status !== 200 && response.status !== 201) {
                toast.error(response.message || "Failed to save feedback");
            } else {
                toast.success(
                    isEditing ? "Feedback updated successfully!" : "Feedback submitted successfully!"
                );
                onSuccess();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to save feedback");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!isLoading) {
            if (!newOpen) {
                setMark("");
                setFeedback("");
            }
            onOpenChange(newOpen);
        }
    };

    if (!student) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Feedback" : "Add Feedback"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Student Info */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium truncate">{student.student_name}</p>
                            <p className="text-sm text-muted-foreground">{student.rollno}</p>
                        </div>
                    </div>

                    {/* Mark Input */}
                    <div className="space-y-2">
                        <Label htmlFor="mark">Mark (0-100)</Label>
                        <Input
                            id="mark"
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Enter mark..."
                            value={mark}
                            onChange={(e) => setMark(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Feedback Textarea */}
                    <div className="space-y-2">
                        <Label htmlFor="feedback">Feedback (Optional)</Label>
                        <Textarea
                            id="feedback"
                            placeholder="Enter feedback for the student..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            disabled={isLoading}
                            rows={4}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : isEditing ? (
                            "Update Feedback"
                        ) : (
                            "Submit Feedback"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FeedbackDialog;
