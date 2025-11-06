import { Button } from "./ui/button";
import { ArrowUp, Plus, Paperclip } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useState, useRef, useEffect } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Checkbox } from "./ui/checkbox";
import { Loader2 } from "lucide-react";

interface IndexedFileResponse {
    file_id: string;
    filename: string;
    minio_path: string;
}

interface ChatInputProps{
    maxHeight: number;
    messageHandler: (message: string) => void;
    onAddFiles?: () => void;
    isUploadingFiles?: boolean;
    onAddContext?: (open: boolean) => void;
    contextOpen?: boolean;
    indexedFiles?: IndexedFileResponse[];
    loadingContext?: boolean;
    selectedContext?: Set<string>;
    onToggleContext?: (filename: string) => void;
}

const ChatInput = ({
    maxHeight, 
    messageHandler, 
    onAddFiles, 
    isUploadingFiles = false,
    onAddContext,
    contextOpen = false,
    indexedFiles = [],
    loadingContext = false,
    selectedContext = new Set(),
    onToggleContext
}:ChatInputProps)=>{
    const [message, setMessage] = useState("");
    const inputRef = useRef<HTMLDivElement>(null);
    const [showAtMentionPopover, setShowAtMentionPopover] = useState(false);
    const [atMentionPosition, setAtMentionPosition] = useState({ top: 0, left: 0 });

    // Check for @ mention trigger
    useEffect(() => {
        const checkForAtMention = () => {
            const text = inputRef.current?.textContent || "";
            const selection = window.getSelection();
            
            if (!selection || selection.rangeCount === 0) return;
            
            const range = selection.getRangeAt(0);
            const textBeforeCursor = text.substring(0, range.startOffset);
            
            // Check if last character is @ and it's at the start or after a space
            const lastChar = textBeforeCursor[textBeforeCursor.length - 1];
            const charBeforeLast = textBeforeCursor[textBeforeCursor.length - 2];
            
            if (lastChar === '@' && (!charBeforeLast || charBeforeLast === ' ' || charBeforeLast === '\n')) {
                // Get cursor position for popover placement
                const rect = range.getBoundingClientRect();
                setAtMentionPosition({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX
                });
                setShowAtMentionPopover(true);
            } else {
                setShowAtMentionPopover(false);
            }
        };

        checkForAtMention();
    }, [message]);

    const handleSend = () => {
        if (message.trim()) {
            messageHandler(message);
            setMessage("");
            if (inputRef.current) {
                inputRef.current.textContent = "";
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return(
        <>
            {/* @ Mention Popover - appears when @ is typed */}
            {showAtMentionPopover && (
                <div 
                    className="fixed z-50 bg-popover text-popover-foreground rounded-md border shadow-md p-2 w-72 max-h-60 overflow-y-auto"
                    style={{ 
                        top: `${atMentionPosition.top}px`, 
                        left: `${atMentionPosition.left}px` 
                    }}
                >
                    {loadingContext ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="size-4 animate-spin" />
                            <span className="ml-2 text-sm">Loading files...</span>
                        </div>
                    ) : indexedFiles.length === 0 ? (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                            No indexed files available
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground px-2 py-1">Select files to mention:</p>
                            {indexedFiles.map((file) => (
                                <div
                                    key={file.file_id}
                                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer"
                                    onClick={() => {
                                        // Insert file mention at cursor position
                                        const filename = `@${file.filename} `;
                                        if (inputRef.current) {
                                            const currentText = inputRef.current.textContent || "";
                                            // Remove the @ that triggered the popup
                                            const newText = currentText.slice(0, -1) + filename;
                                            inputRef.current.textContent = newText;
                                            setMessage(newText);
                                            
                                            // Move cursor to end
                                            const range = document.createRange();
                                            const sel = window.getSelection();
                                            range.selectNodeContents(inputRef.current);
                                            range.collapse(false);
                                            sel?.removeAllRanges();
                                            sel?.addRange(range);
                                        }
                                        setShowAtMentionPopover(false);
                                    }}
                                >
                                    <Paperclip className="size-3.5 text-muted-foreground" />
                                    <span className="text-sm flex-1 truncate">{file.filename}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="w-full max-w-4xl mx-auto bg-sidebar backdrop-blur-sm border border-border/50 rounded-xl md:rounded-2xl flex flex-col shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-3 md:p-4 pb-2 md:pb-3">
                    <ScrollArea className="max-h-[300px]" style={{ maxHeight: `${maxHeight}px` }}>
                        <div
                            ref={inputRef}
                            contentEditable
                            onInput={(e) => setMessage(e.currentTarget.textContent || "")}
                            onKeyDown={handleKeyDown}
                            onPaste={(e: React.ClipboardEvent<HTMLDivElement>) => {
                                e.preventDefault();
                                const text = e.clipboardData.getData("text/plain");
                                if (!text) return;
                                const sel = window.getSelection();
                                if (!sel || !sel.rangeCount) {
                                    if (inputRef.current) {
                                        inputRef.current.textContent = (inputRef.current.textContent || "") + text;
                                    }
                                } else {
                                    const range = sel.getRangeAt(0);
                                    range.deleteContents();
                                    const textNode = document.createTextNode(text);
                                    range.insertNode(textNode);
                                    // Move caret after inserted text
                                    range.setStartAfter(textNode);
                                    range.collapse(true);
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                }
                                setMessage(inputRef.current?.textContent || "");
                            }}
                            data-placeholder="Message Sudar"
                            className="w-full min-h-10 px-2 md:px-3 py-2 text-sm md:text-base bg-transparent border-0 outline-none focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 empty:before:pointer-events-none"
                            style={{ maxHeight: `${maxHeight}px` }}
                            suppressContentEditableWarning
                        />
                    </ScrollArea>
                </div>
                <div className="w-full flex flex-row gap-2 md:gap-3 justify-between items-center px-3 md:px-4 pb-3 md:pb-4 pt-2 md:pt-3 border-t border-border/30">
                    <div className="flex flex-row gap-1.5 md:gap-2 items-center">
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="gap-1.5 md:gap-2 hover:bg-accent/50 transition-colors text-xs md:text-sm px-2 md:px-3"
                            onClick={onAddFiles}
                            disabled={isUploadingFiles}
                        >
                            <Plus className="size-3.5 md:size-4"/> <span className="hidden sm:inline">Add Files</span><span className="sm:hidden">Files</span>
                        </Button>
                        
                        <Popover open={contextOpen} onOpenChange={onAddContext}>
                            <PopoverTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="gap-1.5 md:gap-2 hover:bg-accent/50 transition-colors text-xs md:text-sm px-2 md:px-3"
                                >
                                    <Paperclip className="size-3.5 md:size-4"/> <span className="hidden sm:inline">Add Context</span><span className="sm:hidden">Context</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="start">
                                <div className="p-4">
                                    <h4 className="font-semibold text-sm mb-3">Indexed Files</h4>
                                    {loadingContext ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="size-5 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : indexedFiles.length === 0 ? (
                                        <div className="text-center py-8 text-sm text-muted-foreground">
                                            No indexed files available
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-[300px]">
                                            <div className="space-y-2">
                                                {indexedFiles.map((file) => (
                                                    <div
                                                        key={file.file_id}
                                                        className="flex items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors"
                                                    >
                                                        <Checkbox
                                                            checked={selectedContext.has(file.filename)}
                                                            onCheckedChange={() => onToggleContext?.(file.filename)}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{file.filename}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{file.minio_path}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                    {selectedContext.size > 0 && (
                                        <div className="mt-3 pt-3 border-t">
                                            <p className="text-xs text-muted-foreground">
                                                {selectedContext.size} file{selectedContext.size !== 1 ? 's' : ''} selected
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Button 
                        className="gap-1.5 md:gap-2 rounded-full px-4 md:px-6 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 text-xs md:text-sm"
                        onClick={handleSend}
                        disabled={!message.trim()}
                    >
                        <ArrowUp className="size-3.5 md:size-4"/> Send
                    </Button>
                </div>
            </div>
        </>
    )
}

export default ChatInput;

