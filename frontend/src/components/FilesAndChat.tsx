import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Section {
  id: string;
  title?: string;
  content: React.ReactNode;
  className?: string;
  searchableText?: string; // Optional text content to search within this section
}

export interface FilesAndChatProps {
  // Dialog state management
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Content
  title: string;
  description?: string;
  sections: Section[];
  
  // Search functionality
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  enableClientSideSearch?: boolean; // Enable built-in search filtering
  
  // Dimensions
  width?: string;
  height?: string;
  maxWidth?: string;
  scrollAreaHeight?: string; // Fixed height for the scroll area
  
  // Additional customization
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

const FilesAndChat: React.FC<FilesAndChatProps> = ({
  open,
  onOpenChange,
  title,
  description,
  sections,
  showSearch = true, // Enable search by default
  searchPlaceholder = "Search...",
  onSearchChange,
  enableClientSideSearch = true, // Enable built-in filtering by default
  width = "w-full",
  height = "h-auto",
  maxWidth = "max-w-2xl",
  scrollAreaHeight = "h-[60vh]", // Fixed height for scroll area
  headerContent,
  footerContent,
  className,
  contentClassName,
}) => {
  const [searchValue, setSearchValue] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearchChange?.(value);
  };

  // Filter sections based on search value
  const filteredSections = React.useMemo(() => {
    if (!enableClientSideSearch || !searchValue.trim()) {
      return sections;
    }

    const searchLower = searchValue.toLowerCase();
    
    return sections.filter(section => {
      // Only check if searchableText matches (the actual content)
      if (section.searchableText?.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      return false;
    });
  }, [sections, searchValue, enableClientSideSearch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          width,
          maxWidth,
          height,
          "flex flex-col gap-0 p-0",
          className
        )}
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex flex-col gap-2">
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            {headerContent}
          </div>
        </DialogHeader>

        {/* Search Bar */}
        {showSearch && (
          <div className="px-6 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>
          </div>
        )}

        {/* Content Sections */}
        <ScrollArea className={cn(scrollAreaHeight, contentClassName)}>
          <div className="p-6 space-y-6">
            {filteredSections.length > 0 ? (
              filteredSections.map((section, index) => (
                <div key={section.id} className={cn(section.className)}>
                  {section.title && (
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                      {section.title}
                    </h3>
                  )}
                  {section.content}
                  {index < filteredSections.length - 1 && (
                    <div className="mt-6 border-b" />
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No results found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your search terms
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {footerContent && (
          <div className="px-6 py-4 border-t bg-muted/30">
            {footerContent}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FilesAndChat;