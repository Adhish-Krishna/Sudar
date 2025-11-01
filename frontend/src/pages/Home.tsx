import MainCard from "@/components/MainCards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Trash2, Plus, Users, Home as HomeIcon} from "lucide-react";
import { classrooms } from "@/api";
import type { ClassroomResponse } from "@/api";
import { useState, useEffect} from "react";
import { toast } from "sonner";
import { CreateEditDialogue } from "@/components/CreateEditDialogue";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClassroomRefresh } from "@/contexts/ClassroomContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { colors } from "@/colors";

const Home = ()=>{
    const [classroom, setClassroom] = useState<ClassroomResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [classroomName, setClassroomName] = useState<string>("");
    const [createLoading, setCreateLoading] = useState<boolean>(false);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [editingClassroomId, setEditingClassroomId] = useState<string>("");
    
    const { triggerRefresh } = useClassroomRefresh();
    
    useEffect(()=>{
        const fetchClassrooms = async () => {
            setLoading(true);
            try {
                const response = await classrooms.getClassrooms();
                
                if (response.status && response.status !== 200) {
                    toast.error(response.message || "Failed to fetch classrooms");
                    setClassroom([]);
                } else if (Array.isArray(response)) {
                    setClassroom(response);
                } else {
                    toast.error("Unexpected response format");
                    setClassroom([]);
                }
            } catch (error: any) {
                toast.error(error.message || "Failed to fetch classrooms");
                setClassroom([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchClassrooms();
    }, [])

    const deleteClassroom = async (classroom_id: string)=>{
        try {
            const response = await classrooms.deleteClassroom(classroom_id);
            
            if (response.status && response.status !== 204) {
                toast.error(response.message || "Failed to delete classroom");
            } else {
                toast.success("Classroom deleted successfully!");
                const updatedClassrooms = await classrooms.getClassrooms();
                if (Array.isArray(updatedClassrooms)) {
                    setClassroom(updatedClassrooms);
                }
                triggerRefresh(); // Notify sidebar to refresh
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete classroom");
        }
    }

    const handleCreateClassroom = async () => {
        if (!classroomName.trim()) {
            toast.error("Please enter a classroom name");
            return;
        }

        setCreateLoading(true);
        try {
            const response = await classrooms.createClassroom({ classroom_name: classroomName });
            
            if (response.status && response.status !== 201) {
                toast.error(response.message || "Failed to create classroom");
            } else {
                toast.success("Classroom created successfully!");
                setIsDialogOpen(false);
                setClassroomName("");
                // Refresh the classrooms list
                const updatedClassrooms = await classrooms.getClassrooms();
                if (Array.isArray(updatedClassrooms)) {
                    setClassroom(updatedClassrooms);
                }
                triggerRefresh(); // Notify sidebar to refresh
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to create classroom");
        } finally {
            setCreateLoading(false);
        }
    };

    const handleEditClassroom = async () => {
        if (!classroomName.trim()) {
            toast.error("Please enter a classroom name");
            return;
        }

        setCreateLoading(true);
        try {
            const response = await classrooms.updateClassroom(editingClassroomId, { 
                classroom_name: classroomName 
            });
            
            if (response.status && response.status !== 200) {
                toast.error(response.message || "Failed to update classroom");
            } else {
                toast.success("Classroom updated successfully!");
                setIsDialogOpen(false);
                setClassroomName("");
                setEditMode(false);
                setEditingClassroomId("");
                // Refresh the classrooms list
                const updatedClassrooms = await classrooms.getClassrooms();
                if (Array.isArray(updatedClassrooms)) {
                    setClassroom(updatedClassrooms);
                }
                triggerRefresh(); // Notify sidebar to refresh
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update classroom");
        } finally {
            setCreateLoading(false);
        }
    };

    const handleCancelCreate = () => {
        setClassroomName("");
        setIsDialogOpen(false);
        setEditMode(false);
        setEditingClassroomId("");
    };

    const openEditDialog = (classroomId: string, currentName: string) => {
        setEditingClassroomId(classroomId);
        setClassroomName(currentName);
        setEditMode(true);
        setIsDialogOpen(true);
    };
    
    return(
        <>
            {/* Header with Sidebar Trigger and Breadcrumb */}
            <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6 sticky top-0 z-50">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage className="flex items-center gap-1.5">
                                <HomeIcon className="h-4 w-4" />
                                Home
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            {/* Main Content */}
            <ScrollArea className="h-[calc(100vh-3.5rem)] w-full">
                <div className="flex flex-col gap-4 p-4 lg:p-6">
                {classroom.length>0 && (
                    <div className="flex w-full flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                        <p className="text-xl sm:text-2xl font-bold">Classrooms</p>
                        <Button 
                            onClick={() => setIsDialogOpen(true)} 
                            className="w-full sm:w-auto"
                            size="lg"
                        >
                            <Plus className="h-4 w-4 sm:mr-1" />
                            <span className="">Add Classroom</span>
                        </Button>
                    </div>
                )}
                <div className="flex flex-wrap gap-3 sm:gap-4 justify-center sm:justify-start">
                    {classroom.length > 0 ? (
                        classroom.map((classroomItem, index) => (
                            <MainCard
                                key={classroomItem.classroom_id}
                                title={classroomItem.classroom_name}
                                editButton={
                                    <Button 
                                        variant="ghost" 
                                        className="w-full justify-start gap-2 hover:bg-transparent text-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openEditDialog(classroomItem.classroom_id, classroomItem.classroom_name);
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
                                            deleteClassroom(classroomItem.classroom_id);
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        Delete
                                    </Button>
                                }
                                navigateTo={`/classroom/${classroomItem.classroom_id}`}
                                color={colors[index%colors.length]}
                            />
                        ))
                    ) : (
                        <div className="w-full h-[70vh] flex items-center justify-center flex-col gap-3">
                            {loading? (
                            <div className="flex flex-col items-center gap-4">
                                <Button disabled size="default" className="w-full sm:w-auto">
                                    <Spinner />
                                    <span className="ml-2">Loading Classrooms</span>
                                </Button>
                            </div>
                            ): (
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <Users className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground"/>
                                    <p className="text-muted-foreground text-lg sm:text-2xl mb-2 sm:mb-3 px-4">
                                        No classrooms found. Create your classroom
                                    </p>
                                    <Button 
                                        onClick={() => setIsDialogOpen(true)}
                                        className="w-full sm:w-auto"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Create Classroom
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                </div>
            </ScrollArea>

            <CreateEditDialogue
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                title={editMode ? "Edit Classroom" : "Create New Classroom"}
                description={editMode ? "Update the classroom name" : "Enter a name for your new classroom"}
                mode={editMode ? "edit" : "create"}
                loading={createLoading}
                onSubmit={editMode ? handleEditClassroom : handleCreateClassroom}
                onCancel={handleCancelCreate}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="classroom-name">Classroom Name</Label>
                        <Input
                            id="classroom-name"
                            placeholder="e.g., MyClassroom"
                            value={classroomName}
                            onChange={(e) => setClassroomName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    editMode ? handleEditClassroom() : handleCreateClassroom();
                                }
                            }}
                        />
                    </div>
                </div>
            </CreateEditDialogue>
        </>
    )
}

export default Home;