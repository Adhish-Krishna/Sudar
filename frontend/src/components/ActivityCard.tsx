import { File, SquarePlay } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { type ActivityTypeEnum } from "@/api";

interface ActivityCardProps{
    title: string;
    type: ActivityTypeEnum
    created_at: string
    navigateTo: string
}

const ActivityCard = ({title, type, created_at, navigateTo}:ActivityCardProps)=>{
    const navigate = useNavigate();
    return(
        <>
            <button className="relative w-full h-20 bg-background border rounded-2xl flex flex-row justify-start items-center gap-5 p-3 cursor-pointer hover:bg-accent transition-colors duration-200" onClick={()=>navigate(navigateTo)}>
                {type=="Worksheet"?(<File className="h-7 w-7"/>):(<SquarePlay className="w-7 h-7"/>)}
                <div className="flex flex-col items-start flex-1">
                    <p className="text font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{created_at}</p>
                </div>
            </button>
        </>
    )
}

export default ActivityCard;