import { subjects, students, classrooms } from "@/api";
import type { SubjectResponse, StudentResponse, SubjectCreate, SubjectUpdate, StudentCreate, StudentUpdate } from "@/api";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainCard from "@/components/MainCards";
import CreateEditDialogue from "@/components/CreateEditDialogue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Trash2, Plus, BookOpen, Users, MoreVertical, Home as HomeIcon } from "lucide-react";
import { toast } from "sonner";
import { useClassroomRefresh } from "@/contexts/ClassroomContext";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { colors as subjectColors } from "@/colors";
import { useIsMobile } from "@/hooks/use-mobile";

const Classroom = ()=>{
    const { classroom_id } = useParams<{ classroom_id: string }>();
    const { triggerRefresh } = useClassroomRefresh();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    
    // Classroom state
    const [classroomName, setClassroomName] = useState<string>("");
    
    // Subject states
    const [subjectList, setSubjectList] = useState<SubjectResponse[]>([]);
    const [subjectsLoading, setSubjectsLoading] = useState<boolean>(true);
    const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState<boolean>(false);
    const [subjectName, setSubjectName] = useState<string>("");
    const [subjectActionLoading, setSubjectActionLoading] = useState<boolean>(false);
    const [subjectEditMode, setSubjectEditMode] = useState<boolean>(false);
    const [editingSubjectId, setEditingSubjectId] = useState<string>("");

    // Student states
    const [studentList, setStudentList] = useState<StudentResponse[]>([]);
    const [studentsLoading, setStudentsLoading] = useState<boolean>(true);
    const [isStudentDialogOpen, setIsStudentDialogOpen] = useState<boolean>(false);
    const [studentFormData, setStudentFormData] = useState({
        rollno: "",
        student_name: "",
        dob: "",
        grade: ""
    });
    const [studentActionLoading, setStudentActionLoading] = useState<boolean>(false);
    const [studentEditMode, setStudentEditMode] = useState<boolean>(false);
    const [editingStudentRollno, setEditingStudentRollno] = useState<string>("");

    // Fetch subjects
    useEffect(() => {
        if (classroom_id) {
            fetchSubjects();
            fetchClassroomName();
        }
    }, [classroom_id]);

    // Fetch students
    useEffect(() => {
        if (classroom_id) {
            fetchStudents();
        }
    }, [classroom_id]);

    const fetchClassroomName = async () => {
        if (!classroom_id) return;
        
        try {
            const response = await classrooms.getClassrooms();
            if (Array.isArray(response)) {
                const classroom = response.find(c => c.classroom_id === classroom_id);
                if (classroom) {
                    setClassroomName(classroom.classroom_name);
                }
            }
        } catch (error) {
            console.error("Failed to fetch classroom name:", error);
        }
    };

    const fetchSubjects = async () => {
        if (!classroom_id) return;
        
        setSubjectsLoading(true);
        try {
            const response = await subjects.getSubjects(classroom_id);
            
            if (response.status && response.status !== 200) {
                toast.error(response.message || "Failed to fetch subjects");
                setSubjectList([]);
            } else if (Array.isArray(response)) {
                setSubjectList(response);
            } else {
                toast.error("Unexpected response format");
                setSubjectList([]);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch subjects");
            setSubjectList([]);
        } finally {
            setSubjectsLoading(false);
        }
    };

    const fetchStudents = async () => {
        if (!classroom_id) return;
        
        setStudentsLoading(true);
        try {
            const response = await students.getStudents(classroom_id);
            
            if (response.status && response.status !== 200) {
                toast.error(response.message || "Failed to fetch students");
                setStudentList([]);
            } else if (Array.isArray(response)) {
                setStudentList(response);
            } else {
                toast.error("Unexpected response format");
                setStudentList([]);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch students");
            setStudentList([]);
        } finally {
            setStudentsLoading(false);
        }
    };

    // Subject handlers
    const handleCreateSubject = async () => {
        if (!subjectName.trim()) {
            toast.error("Please enter a subject name");
            return;
        }

        if (!classroom_id) return;

        setSubjectActionLoading(true);
        try {
            const payload: SubjectCreate = { subject_name: subjectName };
            const response = await subjects.createSubject(classroom_id, payload);
            
            if (response.status && response.status !== 201) {
                toast.error(response.message || "Failed to create subject");
            } else {
                toast.success("Subject created successfully!");
                setIsSubjectDialogOpen(false);
                setSubjectName("");
                await fetchSubjects();
                triggerRefresh();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to create subject");
        } finally {
            setSubjectActionLoading(false);
        }
    };

    const handleEditSubject = async () => {
        if (!subjectName.trim()) {
            toast.error("Please enter a subject name");
            return;
        }

        if (!classroom_id || !editingSubjectId) return;

        setSubjectActionLoading(true);
        try {
            const payload: SubjectUpdate = { subject_name: subjectName };
            const response = await subjects.updateSubject(classroom_id, editingSubjectId, payload);
            
            if (response.status && response.status !== 200) {
                toast.error(response.message || "Failed to update subject");
            } else {
                toast.success("Subject updated successfully!");
                setIsSubjectDialogOpen(false);
                setSubjectName("");
                setSubjectEditMode(false);
                setEditingSubjectId("");
                await fetchSubjects();
                triggerRefresh();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update subject");
        } finally {
            setSubjectActionLoading(false);
        }
    };

    const handleDeleteSubject = async (subjectId: string) => {
        if (!classroom_id) return;

        try {
            const response = await subjects.deleteSubject(classroom_id, subjectId);
            
            if (response.status && response.status !== 204) {
                toast.error(response.message || "Failed to delete subject");
            } else {
                toast.success("Subject deleted successfully!");
                await fetchSubjects();
                triggerRefresh();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete subject");
        }
    };

    const openEditSubjectDialog = (subjectId: string, currentName: string) => {
        setEditingSubjectId(subjectId);
        setSubjectName(currentName);
        setSubjectEditMode(true);
        setIsSubjectDialogOpen(true);
    };

    const handleCancelSubject = () => {
        setSubjectName("");
        setIsSubjectDialogOpen(false);
        setSubjectEditMode(false);
        setEditingSubjectId("");
    };

    // Student handlers
    const handleCreateStudent = async () => {
        if (!studentFormData.rollno.trim() || !studentFormData.student_name.trim() || 
            !studentFormData.dob || !studentFormData.grade) {
            toast.error("Please fill all required fields");
            return;
        }

        if (!classroom_id) return;

        setStudentActionLoading(true);
        try {
            const payload: StudentCreate = {
                rollno: studentFormData.rollno,
                student_name: studentFormData.student_name,
                dob: studentFormData.dob,
                grade: parseInt(studentFormData.grade)
            };
            const response = await students.createStudent(classroom_id, payload);
            
            if (response.status && response.status !== 201) {
                toast.error(response.message || "Failed to enroll student");
            } else {
                toast.success("Student enrolled successfully!");
                setIsStudentDialogOpen(false);
                resetStudentForm();
                await fetchStudents();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to enroll student");
        } finally {
            setStudentActionLoading(false);
        }
    };

    const handleEditStudent = async () => {
        if (!studentFormData.student_name.trim() || !studentFormData.dob || !studentFormData.grade) {
            toast.error("Please fill all required fields");
            return;
        }

        if (!classroom_id || !editingStudentRollno) return;

        setStudentActionLoading(true);
        try {
            const payload: StudentUpdate = {
                student_name: studentFormData.student_name,
                dob: studentFormData.dob,
                grade: parseInt(studentFormData.grade)
            };
            const response = await students.updateStudent(classroom_id, editingStudentRollno, payload);
            
            if (response.status && response.status !== 200) {
                toast.error(response.message || "Failed to update student");
            } else {
                toast.success("Student updated successfully!");
                setIsStudentDialogOpen(false);
                resetStudentForm();
                setStudentEditMode(false);
                setEditingStudentRollno("");
                await fetchStudents();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update student");
        } finally {
            setStudentActionLoading(false);
        }
    };

    const handleDeleteStudent = async (rollno: string) => {
        if (!classroom_id) return;

        try {
            const response = await students.deleteStudent(classroom_id, rollno);
            
            if (response.status && response.status !== 204) {
                toast.error(response.message || "Failed to delete student");
            } else {
                toast.success("Student deleted successfully!");
                await fetchStudents();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete student");
        }
    };

    const openEditStudentDialog = (student: StudentResponse) => {
        setEditingStudentRollno(student.rollno);
        setStudentFormData({
            rollno: student.rollno,
            student_name: student.student_name,
            dob: student.dob,
            grade: student.grade.toString()
        });
        setStudentEditMode(true);
        setIsStudentDialogOpen(true);
    };

    const resetStudentForm = () => {
        setStudentFormData({
            rollno: "",
            student_name: "",
            dob: "",
            grade: ""
        });
    };

    const handleCancelStudent = () => {
        resetStudentForm();
        setIsStudentDialogOpen(false);
        setStudentEditMode(false);
        setEditingStudentRollno("");
    };

    return(
        <>
            {/* Header with Sidebar Trigger and Breadcrumb */}
            <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6 sticky top-0 z-50">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <button 
                                    onClick={() => navigate('/home')}
                                    className="flex items-center gap-1.5"
                                >
                                    <HomeIcon className="h-4 w-4" />
                                    {!isMobile && "Home"}
                                </button>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="flex items-center gap-1.5">
                                <Users className="h-4 w-4"/>{!isMobile && (classroomName || "Classroom")}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            {/* Main Content */}
            <ScrollArea className="h-[calc(100vh-3.5rem)] w-full">
                <Tabs defaultValue="subjects" className="w-full p-4 lg:p-6">
                    <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
                        <TabsTrigger value="subjects" className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span className="hidden sm:inline">Subjects</span>
                        </TabsTrigger>
                        <TabsTrigger value="students" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span className="hidden sm:inline">Students</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Subjects Tab */}
                    <TabsContent value="subjects" className="space-y-4">
                        {subjectList.length > 0 && (
                            <div className="flex w-full flex-col sm:flex-row gap-3 justify-between items-start sm:items-center pb-3">
                                <p className="text-2xl sm:text-3xl font-bold">Subjects</p>
                                <Button 
                                    onClick={() => setIsSubjectDialogOpen(true)} 
                                    className="w-full sm:w-auto"
                                    size="sm"
                                >
                                    <Plus className="h-4 w-4 sm:mr-1" />
                                    <span>Add Subject</span>
                                </Button>
                            </div>
                        )}
                        
                        <div className="flex flex-wrap gap-3 sm:gap-4 justify-center sm:justify-start">
                            {subjectList.length > 0 ? (
                                subjectList.map((subject, index) => (
                                    <MainCard
                                        key={subject.subject_id}
                                        title={subject.subject_name}
                                        editButton={
                                            <Button 
                                                variant="ghost" 
                                                className="w-full justify-start gap-2 hover:bg-transparent text-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditSubjectDialog(subject.subject_id, subject.subject_name);
                                                }}
                                            >
                                                <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                Edit
                                            </Button>
                                        }
                                        deleteButton={
                                            <Button 
                                                variant="ghost" 
                                                className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-transparent text-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSubject(subject.subject_id);
                                                }}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                Delete
                                            </Button>
                                        }
                                        navigateTo={`/subject/${classroom_id}/${subject.subject_id}/${encodeURIComponent(subjectColors[index % subjectColors.length])}`}
                                        color={subjectColors[index % subjectColors.length]}
                                    />
                                ))
                            ) : (
                                <div className="w-full h-[60vh] flex items-center justify-center flex-col gap-3 px-4">
                                    {subjectsLoading ? (
                                        <div className="flex flex-col items-center gap-4">
                                            <Spinner className="size-8"/>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 text-center">
                                            <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                                            <p className="text-muted-foreground text-lg sm:text-2xl mb-2 sm:mb-3 px-4">
                                                No subjects found. Add a subject to get started
                                            </p>
                                            <Button 
                                                onClick={() => setIsSubjectDialogOpen(true)}
                                                className="w-full sm:w-auto"
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add Subject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Students Tab */}
                    <TabsContent value="students" className="space-y-4">
                        {studentList.length > 0 && (
                            <div className="flex w-full flex-col sm:flex-row gap-3 justify-between items-start sm:items-center pb-3">
                                <p className="text-2xl sm:text-3xl font-bold">Students</p>
                                <Button 
                                    onClick={() => setIsStudentDialogOpen(true)} 
                                    className="w-full sm:w-auto"
                                    size="sm"
                                >
                                    <Plus className="h-4 w-4 sm:mr-1" />
                                    <span>Enroll Student</span>
                                </Button>
                            </div>
                        )}
                        
                        <div className="flex flex-wrap gap-3 sm:gap-4 justify-center sm:justify-start">
                            {studentList.length > 0 ? (
                                studentList.map((student) => (
                                    <div
                                        key={student.rollno}
                                        className="w-full sm:w-64 border-2 border-muted rounded-lg p-4 hover:shadow-lg transition-all duration-300 bg-card"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg line-clamp-1">{student.student_name}</h3>
                                                <p className="text-sm text-muted-foreground">Roll No: {student.rollno}</p>
                                            </div>
                                            <DropdownMenu modal={false}>
                                                <DropdownMenuTrigger asChild>
                                                    <button 
                                                        className="hover:bg-accent rounded-full p-1.5 transition-colors shrink-0 ml-2"
                                                    >
                                                        <MoreVertical className="h-5 w-5" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-40 sm:w-48" align="end">
                                                    <DropdownMenuItem asChild className="cursor-pointer">
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start gap-2 hover:bg-transparent text-sm"
                                                            onClick={() => openEditStudentDialog(student)}
                                                        >
                                                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                            Edit
                                                        </Button>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem asChild className="cursor-pointer">
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-transparent text-sm"
                                                            onClick={() => handleDeleteStudent(student.rollno)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                            Delete
                                                        </Button>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <p><span className="text-muted-foreground">DOB:</span> {new Date(student.dob).toLocaleDateString()}</p>
                                            <p><span className="text-muted-foreground">Grade:</span> {student.grade}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="w-full h-[60vh] flex items-center justify-center flex-col gap-3 px-4">
                                    {studentsLoading ? (
                                        <div className="flex flex-col items-center gap-4">
                                            <Spinner className="size-8" />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 text-center">
                                            <Users className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                                            <p className="text-muted-foreground text-lg sm:text-2xl mb-2 sm:mb-3 px-4">
                                                No students enrolled. Enroll a student to get started
                                            </p>
                                            <Button 
                                                onClick={() => setIsStudentDialogOpen(true)}
                                                className="w-full sm:w-auto"
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Enroll Student
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </ScrollArea>

            {/* Subject Dialog */}
            <CreateEditDialogue
                open={isSubjectDialogOpen}
                onOpenChange={setIsSubjectDialogOpen}
                title={subjectEditMode ? "Edit Subject" : "Add New Subject"}
                description={subjectEditMode ? "Update the subject name" : "Enter a name for the new subject"}
                mode={subjectEditMode ? "edit" : "create"}
                loading={subjectActionLoading}
                onSubmit={subjectEditMode ? handleEditSubject : handleCreateSubject}
                onCancel={handleCancelSubject}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="subject-name">Subject Name</Label>
                        <Input
                            id="subject-name"
                            placeholder="e.g., Mathematics, Science"
                            value={subjectName}
                            onChange={(e) => setSubjectName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    subjectEditMode ? handleEditSubject() : handleCreateSubject();
                                }
                            }}
                        />
                    </div>
                </div>
            </CreateEditDialogue>

            {/* Student Dialog */}
            <CreateEditDialogue
                open={isStudentDialogOpen}
                onOpenChange={setIsStudentDialogOpen}
                title={studentEditMode ? "Edit Student" : "Enroll New Student"}
                description={studentEditMode ? "Update student information" : "Enter student details to enroll"}
                mode={studentEditMode ? "edit" : "create"}
                loading={studentActionLoading}
                onSubmit={studentEditMode ? handleEditStudent : handleCreateStudent}
                onCancel={handleCancelStudent}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="student-rollno">Roll Number</Label>
                        <Input
                            id="student-rollno"
                            placeholder="e.g., 2024001"
                            value={studentFormData.rollno}
                            onChange={(e) => setStudentFormData({...studentFormData, rollno: e.target.value})}
                            disabled={studentEditMode}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="student-name">Student Name</Label>
                        <Input
                            id="student-name"
                            placeholder="e.g., John Doe"
                            value={studentFormData.student_name}
                            onChange={(e) => setStudentFormData({...studentFormData, student_name: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="student-dob">Date of Birth</Label>
                        <Input
                            id="student-dob"
                            type="date"
                            value={studentFormData.dob}
                            onChange={(e) => setStudentFormData({...studentFormData, dob: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="student-grade">Grade</Label>
                        <Input
                            id="student-grade"
                            type="number"
                            placeholder="e.g., 10"
                            value={studentFormData.grade}
                            onChange={(e) => setStudentFormData({...studentFormData, grade: e.target.value})}
                            min="1"
                            max="12"
                        />
                    </div>
                </div>
            </CreateEditDialogue>
        </>
    )
}

export default Classroom;