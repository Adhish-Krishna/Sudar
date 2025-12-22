import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, User } from "lucide-react";
import { type StudentResponse, type PerformanceResponse } from "@/api";

interface StudentFeedbackCardProps {
    student: StudentResponse;
    performance?: PerformanceResponse;
    onAction: () => void;
}

const StudentFeedbackCard = ({
    student,
    performance,
    onAction,
}: StudentFeedbackCardProps) => {
    const hasSubmitted = !!performance;

    return (
        <div className="flex items-center gap-4 p-4 rounded-lg border bg-background hover:bg-accent/50 transition-colors">
            {/* Status Icon */}
            <div className="shrink-0">
                {hasSubmitted ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                )}
            </div>

            {/* Student Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{student.student_name}</p>
                    <p className="text-sm text-muted-foreground">{student.rollno}</p>
                </div>
            </div>

            {/* Mark Badge (if submitted) */}
            {hasSubmitted && (
                <div className="shrink-0 hidden sm:flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Mark:</span>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                        {performance.teacher_mark}/100
                    </span>
                </div>
            )}

            {/* Action Button */}
            <Button
                variant={hasSubmitted ? "outline" : "default"}
                size="sm"
                onClick={onAction}
            >
                {hasSubmitted ? "Edit" : "Add Feedback"}
            </Button>
        </div>
    );
};

export default StudentFeedbackCard;
