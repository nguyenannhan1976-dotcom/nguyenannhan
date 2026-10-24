import { CheckCircle2 } from "lucide-react";
import { cn } from "../utils/cn";

export type GameSuggestionObj = {
  loai: string;
  moTa: string;
  doKho: "Dễ" | "Trung bình" | "Khó";
  thoiGian: string;
  icon: string;
  mauSac: string;
};

export function GameSuggestions({ 
  suggestions, 
  selected, 
  onSelect 
}: { 
  suggestions: GameSuggestionObj[], 
  selected: GameSuggestionObj | null, 
  onSelect: (g: GameSuggestionObj) => void 
}) {
  return (
    <div className="grid grid-cols-1 gap-4 w-full max-w-4xl mx-auto">
      {suggestions.map((game, idx) => {
        const isSelected = selected?.loai === game.loai;
        let bgGradient = "from-emerald-400 to-teal-500";
        if (game.mauSac && game.mauSac.includes('from-')) {
          bgGradient = game.mauSac;
        }

        return (
          <div 
            key={idx}
            onClick={() => onSelect(game)}
            className={cn(
               "group relative bg-white p-5 rounded-3xl flex items-center gap-6 cursor-pointer transition-all duration-300",
               isSelected ? "border-4 border-indigo-500 shadow-xl transform hover:-translate-y-1 z-10" : "border border-slate-200 shadow-sm hover:border-indigo-300"
            )}
          >
            {isSelected && (
              <div className="absolute top-3 right-3">
                <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            )}
            
            <div className={cn(
              "w-16 h-16 rounded-2xl flex shrink-0 items-center justify-center text-3xl shadow-lg bg-gradient-to-br",
              bgGradient
            )}>
              {game.icon || "🎲"}
            </div>
            
            <div className="flex-1 text-left">
               <div className="flex flex-wrap items-center gap-2 mb-1">
                 <h3 className="font-black text-lg text-slate-900 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:via-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">{game.loai}</h3>
                 <span className={cn(
                   "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                   game.doKho === 'Dễ' ? "bg-green-100 text-green-700" : 
                   game.doKho === 'Trung bình' ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                 )}>
                   {game.doKho}
                 </span>
                 <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">
                   {game.thoiGian}
                 </span>
               </div>
               <p className="text-sm text-slate-500 leading-relaxed">{game.moTa}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
