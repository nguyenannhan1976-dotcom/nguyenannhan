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
               "group relative bg-white p-5 sm:p-6 rounded-3xl flex items-center gap-5 sm:gap-6 cursor-pointer transition-all duration-300",
               isSelected 
                 ? "border-4 border-amber-400 shadow-xl ring-4 ring-amber-100 transform -translate-y-1 z-10 bg-gradient-to-r from-amber-50/30 via-white to-pink-50/30" 
                 : "border-2 border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-md bg-white"
            )}
          >
            {isSelected && (
              <div className="absolute top-3.5 right-3.5">
                <div className="px-2.5 py-1 bg-amber-400 text-amber-950 font-black text-[11px] rounded-full flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-900" />
                  <span>ĐÃ CHỌN</span>
                </div>
              </div>
            )}
            
            <div className={cn(
              "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex shrink-0 items-center justify-center text-3xl sm:text-4xl shadow-md bg-gradient-to-br text-white",
              bgGradient
            )}>
              {game.icon || "🎲"}
            </div>
            
            <div className="flex-1 text-left pr-6">
               <div className="flex flex-wrap items-center gap-2 mb-1.5">
                 <h3 className="font-black text-lg sm:text-xl text-slate-900 group-hover:text-indigo-600 transition-colors">
                   {game.loai}
                 </h3>
                 <span className={cn(
                   "px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase shadow-2xs",
                   game.doKho === 'Dễ' ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : 
                   game.doKho === 'Trung bình' ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-rose-100 text-rose-800 border border-rose-200"
                 )}>
                   {game.doKho}
                 </span>
                 <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full border border-indigo-200 uppercase">
                   ⏱️ {game.thoiGian}
                 </span>
               </div>
               <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                 {game.moTa}
               </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
