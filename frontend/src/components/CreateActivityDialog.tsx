import { useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Loader2 } from "lucide-react";
import { activities, type ActivityTypeEnum } from "@/api";
import { toast } from "sonner";

interface CreateActivityDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedFiles: string[];
    subjectId: string;
    onSuccess: () => void;
}

const CreateActivityDialog = ({
    open,
    onOpenChange,
    selectedFiles,
    subjectId,
    onSuccess,
}: CreateActivityDialogProps) => {
    const [title, setTitle] = useState("");
    const [activityType, setActivityType] = useState<ActivityTypeEnum>("Worksheet");
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async () => {
        if (!title.trim()) {
            toast.error("Please enter an activity title");
            return;
        }

        if (selectedFiles.length === 0) {
            toast.error("Please select at least one file");
            return;
        }

        setIsLoading(true);
        try {
            const response = await activities.createActivity(subjectId, {
                title: title.trim(),
                type: activityType,
                files: selectedFiles.map((filePath) => ({ minio_path: filePath })),
            });

            if (response.status && response.status !== 201) {
                toast.error(response.message || "Failed to create activity");
            } else if (response.activity_id) {
                toast.success("Activity created successfully!");
                setTitle("");
                setActivityType("Worksheet");
                onSuccess();
            } else {
                toast.error("Failed to create activity");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to create activity");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!isLoading) {
            if (!newOpen) {
                setTitle("");
                setActivityType("Worksheet");
            }
            onOpenChange(newOpen);
        }
    };

    // Extract filename from full path (handles bucket:path format)
    const getFileName = (path: string) => {
        let cleanPath = path;
        if (path.startsWith('input:') || path.startsWith('output:')) {
            cleanPath = path.substring(path.indexOf(':') + 1);
        }
        return cleanPath.split("/").pop() || cleanPath;
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Activity</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Title Input */}
                    <div className="space-y-2">
                        <Label htmlFor="activity-title">Activity Title</Label>
                        <Input
                            id="activity-title"
                            placeholder="Enter activity title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Activity Type Selection */}
                    <div className="space-y-2">
                        <Label>Activity Type</Label>
                        <Tabs
                            value={activityType}
                            onValueChange={(value) => setActivityType(value as ActivityTypeEnum)}
                        >
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="Worksheet" disabled={isLoading}>
                                    Worksheet
                                </TabsTrigger>
                                <TabsTrigger value="Content" disabled={isLoading}>
                                    Content
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <p className="text-xs text-muted-foreground">
                            {activityType === "Worksheet"
                                ? "Worksheets allow you to add student feedback and marks."
                                : "Content is for reference materials without grading."}
                        </p>
                    </div>

                    {/* Selected Files */}
                    <div className="space-y-2">
                        <Label>Selected Files ({selectedFiles.length})</Label>
                        <ScrollArea className="h-32 rounded-md border p-2">
                            <div className="space-y-1">
                                {selectedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                                    >
                                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <span className="truncate">{getFileName(file)}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
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
                    <Button onClick={handleCreate} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Activity"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateActivityDialog;
