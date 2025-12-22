import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
    Home as HomeIcon,
    Users,
    BookOpen,
    FileText,
    File,
    SquarePlay,
    Download,
    Loader2,
    Clock,
    MessageSquare,
    Trash2,
} from "lucide-react";
import {
    activities,
    students,
    performance,
    documents,
    classrooms,
    subjects,
    type ActivityResponse,
    type StudentResponse,
    type PerformanceResponse,
} from "@/api";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import StudentFeedbackCard from "../components/StudentFeedbackCard";
import FeedbackDialog from "../components/FeedbackDialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Activity = () => {
    const { classroom_id, activity_id } = useParams<{
        classroom_id: string;
        activity_id: string;
    }>();
    const navigate = useNavigate();
    const isMobile = useIsMobile();

    // Data states
    const [activity, setActivity] = useState<ActivityResponse | null>(null);
    const [studentList, setStudentList] = useState<StudentResponse[]>([]);
    const [performanceList, setPerformanceList] = useState<PerformanceResponse[]>([]);
    const [classroomName, setClassroomName] = useState("");
    const [subjectName, setSubjectName] = useState("");

    // Loading states
    const [loadingActivity, setLoadingActivity] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [loadingPerformances, setLoadingPerformances] = useState(false);

    // Feedback dialog state
    const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentResponse | null>(null);
    const [selectedPerformance, setSelectedPerformance] = useState<PerformanceResponse | null>(null);

    // Download state
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

    // Delete state
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch activity details
    useEffect(() => {
        const fetchActivity = async () => {
            if (!activity_id) return;

            setLoadingActivity(true);
            try {
                const response = await activities.getActivity(activity_id);

                if (response.status && response.status !== 200) {
                    toast.error(response.message || "Failed to fetch activity");
                    navigate(-1);
                    return;
                }

                setActivity(response);

                // Fetch classroom and subject names
                if (classroom_id && response.subject_id) {
                    const [classroomRes, subjectRes] = await Promise.all([
                        classrooms.getClassroom(classroom_id),
                        subjects.getSubject(classroom_id, response.subject_id),
                    ]);

                    if (classroomRes.classroom_name) {
                        setClassroomName(classroomRes.classroom_name);
                    }
                    if (subjectRes.subject_name) {
                        setSubjectName(subjectRes.subject_name);
                    }
                }

                // If worksheet, fetch students and performances
                if (response.type === "Worksheet" && classroom_id) {
                    fetchStudentsAndPerformances();
                }
            } catch (error: any) {
                toast.error(error.message || "Failed to fetch activity");
                navigate(-1);
            } finally {
                setLoadingActivity(false);
            }
        };

        fetchActivity();
    }, [activity_id, classroom_id]);

    // Fetch students and performances for worksheet activities
    const fetchStudentsAndPerformances = async () => {
        if (!classroom_id || !activity_id) return;

        setLoadingStudents(true);
        setLoadingPerformances(true);

        try {
            const [studentsRes, performancesRes] = await Promise.all([
                students.getStudents(classroom_id),
                performance.getPerformancesByActivity(activity_id),
            ]);

            if (Array.isArray(studentsRes)) {
                setStudentList(studentsRes);
            }

            if (Array.isArray(performancesRes)) {
                setPerformanceList(performancesRes);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch data");
        } finally {
            setLoadingStudents(false);
            setLoadingPerformances(false);
        }
    };

    // Handle file download
    const handleDownloadFile = async (filePath: string) => {
        setDownloadingFile(filePath);
        try {
            // Parse bucket type from path (format: "bucket:path" or just "path")
            let bucketType: 'input' | 'output' = 'input';
            let actualPath = filePath;

            if (filePath.startsWith('input:')) {
                bucketType = 'input';
                actualPath = filePath.substring(6);
            } else if (filePath.startsWith('output:')) {
                bucketType = 'output';
                actualPath = filePath.substring(7);
            }

            const response = await documents.downloadDocument(bucketType, actualPath);

            if (response.status && response.status !== 200) {
                toast.error(response.message || "Failed to download file");
                return;
            }

            const url = window.URL.createObjectURL(response.blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = response.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`Downloaded ${response.filename}`);
        } catch (error: any) {
            toast.error(error.message || "Failed to download file");
        } finally {
            setDownloadingFile(null);
        }
    };

    // Open feedback dialog
    const handleOpenFeedback = (student: StudentResponse, existingPerformance?: PerformanceResponse) => {
        setSelectedStudent(student);
        setSelectedPerformance(existingPerformance || null);
        setFeedbackDialogOpen(true);
    };

    // Handle feedback success
    const handleFeedbackSuccess = () => {
        setFeedbackDialogOpen(false);
        setSelectedStudent(null);
        setSelectedPerformance(null);
        // Refresh performances
        if (activity_id) {
            performance.getPerformancesByActivity(activity_id).then((res) => {
                if (Array.isArray(res)) {
                    setPerformanceList(res);
                }
            });
        }
    };

    // Get performance for a student
    const getStudentPerformance = (rollno: string): PerformanceResponse | undefined => {
        return performanceList.find((p) => p.student_rollno === rollno);
    };

    // Get filename from path (handles bucket:path format)
    const getFileName = (path: string) => {
        // Remove bucket prefix if present
        let cleanPath = path;
        if (path.startsWith('input:') || path.startsWith('output:')) {
            cleanPath = path.substring(path.indexOf(':') + 1);
        }
        return cleanPath.split("/").pop() || cleanPath;
    };

    // Handle activity deletion
    const handleDeleteActivity = async () => {
        if (!activity_id || !activity) return;

        setIsDeleting(true);
        try {
            const response = await activities.deleteActivity(activity_id);

            if (response.status && response.status !== 204) {
                toast.error(response.message || "Failed to delete activity");
            } else {
                toast.success("Activity deleted successfully");
                // Navigate back to subject page
                navigate(`/subject/${classroom_id}/${activity.subject_id}/bg-blue-500`);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete activity");
        } finally {
            setIsDeleting(false);
        }
    };

    if (loadingActivity) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <Spinner className="size-8" />
            </div>
        );
    }

    if (!activity) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <p className="text-muted-foreground">Activity not found</p>
            </div>
        );
    }

    return (
        <>
            {/* Header with Breadcrumb */}
            <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6 sticky top-0 z-50">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <button
                                    onClick={() => navigate("/home")}
                                    className="flex items-center gap-1.5"
                                >
                                    <HomeIcon className="h-4 w-4" />
                                    {!isMobile && "Home"}
                                </button>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <button
                                    onClick={() => navigate(`/classroom/${classroom_id}`)}
                                    className="flex items-center gap-1.5"
                                >
                                    <Users className="h-4 w-4" />
                                    {!isMobile && (classroomName || "Classroom")}
                                </button>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <button
                                    onClick={() => navigate(`/subject/${classroom_id}/${activity.subject_id}/bg-blue-500`)}
                                    className="flex items-center gap-1.5"
                                >
                                    <BookOpen className="h-4 w-4" />
                                    {!isMobile && (subjectName || "Subject")}
                                </button>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="flex items-center gap-1.5">
                                {activity.type === "Worksheet" ? (
                                    <File className="h-4 w-4" />
                                ) : (
                                    <SquarePlay className="h-4 w-4" />
                                )}
                                {!isMobile && "Activity"}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            {/* Main Content */}
            <div className="h-[calc(100vh-3.5rem)] w-full">
                <div className="flex flex-col gap-4 p-4 lg:p-6">
                    {/* Activity Header Card */}
                    <div className="w-full bg-card border rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-primary/10">
                                {activity.type === "Worksheet" ? (
                                    <File className="h-8 w-8 text-primary" />
                                ) : (
                                    <SquarePlay className="h-8 w-8 text-primary" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold">{activity.title}</h1>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {new Date(activity.created_at).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </span>
                                    <span className="px-2 py-0.5 bg-secondary rounded-full text-xs font-medium">
                                        {activity.type}
                                    </span>
                                </div>
                            </div>
                            {/* Delete Button */}
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-5 w-5" />
                                        )}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Activity</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete "{activity.title}"? This action cannot be undone. All associated files and student feedback will be permanently removed.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDeleteActivity}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    {/* Files Section */}
                    {activity.files && activity.files.length > 0 && (
                        <div className="w-full bg-card border rounded-2xl overflow-hidden">
                            <div className="flex items-center gap-3 p-4 border-b">
                                <FileText className="h-5 w-5" />
                                <h2 className="text-lg font-semibold">
                                    Files ({activity.files.length})
                                </h2>
                            </div>
                            <div className="p-4">
                                <div className="space-y-2">
                                    {activity.files.map((file) => (
                                        <div
                                            key={file.file_id}
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                                        >
                                            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                                            <span className="flex-1 truncate text-sm">
                                                {getFileName(file.minio_path)}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDownloadFile(file.minio_path)}
                                                disabled={downloadingFile === file.minio_path}
                                            >
                                                {downloadingFile === file.minio_path ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Download className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Student Feedback Section - Only for Worksheet type */}
                    {activity.type === "Worksheet" && (
                        <div
                            className="w-full bg-card border rounded-2xl overflow-hidden"
                            style={{ height: "calc(50vh)" }}
                        >
                            <div className="flex items-center gap-3 p-4 border-b shrink-0">
                                <MessageSquare className="h-5 w-5" />
                                <h2 className="text-lg font-semibold">Student Feedback</h2>
                                <span className="ml-auto text-sm text-muted-foreground">
                                    {performanceList.length} / {studentList.length} submitted
                                </span>
                            </div>
                            <ScrollArea className="h-[calc(100%-60px)]">
                                <div className="p-4 space-y-2">
                                    {loadingStudents || loadingPerformances ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : studentList.length > 0 ? (
                                        studentList.map((student) => {
                                            const studentPerformance = getStudentPerformance(student.rollno);
                                            return (
                                                <StudentFeedbackCard
                                                    key={student.rollno}
                                                    student={student}
                                                    performance={studentPerformance}
                                                    onAction={() => handleOpenFeedback(student, studentPerformance)}
                                                />
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-8">
                                            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                                            <p className="text-sm text-muted-foreground">
                                                No students in this classroom
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </div>

            {/* Feedback Dialog */}
            <FeedbackDialog
                open={feedbackDialogOpen}
                onOpenChange={setFeedbackDialogOpen}
                student={selectedStudent}
                activityId={activity_id!}
                existingPerformance={selectedPerformance}
                onSuccess={handleFeedbackSuccess}
            />
        </>
    );
};

export default Activity;
