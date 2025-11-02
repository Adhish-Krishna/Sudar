import React from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react";

interface MainCardProps{
    title: string;
    editButton: React.JSX.Element;
    deleteButton: React.JSX.Element;
    navigateTo: string;
    color: string
}

const MainCard = ({title, editButton, deleteButton, navigateTo, color}:MainCardProps)=>{
    const navigate = useNavigate();
    
    const handleCardClick = (e: React.MouseEvent) => {
        // Check if click is on dropdown trigger, dropdown content, or any button
        const target = e.target as HTMLElement;
        if (
            target.closest('[role="button"]') || 
            target.closest('[role="menuitem"]') ||
            target.closest('button')
        ) {
            return;
        }
        navigate(navigateTo);
    };
    
    return(
        <div 
            className={`${color.trim()} w-full sm:w-64 h-36 sm:h-40 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 cursor-pointer active:scale-95`}
            onClick={handleCardClick}
        >
            <div className="flex justify-between items-start h-full">
                <div className="flex flex-col justify-between h-full flex-1 min-w-0 pr-2">
                    <p className="font-bold text-xl sm:text-2xl text-white wrap-break-word line-clamp-2">{title}</p>
                </div>
                
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <button 
                            className="hover:bg-white/20 rounded-full p-1.5 sm:p-1 transition-colors text-white shrink-0 ml-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreVertical className="h-5 w-5 sm:h-5 sm:w-5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40 sm:w-48 border-white/30" align="end">
                        <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/20">
                            {editButton}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/20" />
                        <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/20">
                            {deleteButton}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}

export default MainCard;