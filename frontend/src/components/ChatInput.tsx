import { Button } from "./ui/button";
import { ArrowUp, Plus, Paperclip } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useState, useRef } from "react";


interface ChatInputProps{
    maxHeight: number;
    messageHandler: (message: string) => void;
    onAddFiles?: () => void;
    isUploadingFiles?: boolean;
}

const ChatInput = ({maxHeight, messageHandler, onAddFiles, isUploadingFiles = false}:ChatInputProps)=>{
    const [message, setMessage] = useState("");
    const inputRef = useRef<HTMLDivElement>(null);

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
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="gap-1.5 md:gap-2 hover:bg-accent/50 transition-colors text-xs md:text-sm px-2 md:px-3"
                        >
                            <Paperclip className="size-3.5 md:size-4"/> <span className="hidden sm:inline">Add Context</span><span className="sm:hidden">Context</span>
                        </Button>
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

