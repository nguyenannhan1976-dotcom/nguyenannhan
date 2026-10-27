import { CheckCircle2, Clock, Sparkles, ArrowRight, Zap } from "lucide-react";
import { cn } from "../utils/cn";

export type GameSuggestionObj = {
  loai: string;
  moTa: string;
  doKho: "Dễ" | "Trung bình" | "Khó" | string;
  thoiGian: string;
  icon: string;
  mauSac: string;
};

export function GameSuggestions({ 
  suggestions, 
  selected, 
  onSelect 
}: { 
  suggestions: GameSuggestionObj[]; 
  selected: GameSuggestionObj | null; 
  onSelect: (g: GameSuggestionObj) => void;
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
            onClick={() => {
              onSelect(game);
              try {
                if ((window as any).playGameSound) {
                  (window as any).playGameSound('click');
                }
              } catch(e) {}
            }}
            className={cn(
               "group relative bg-white p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 cursor-pointer transition-all duration-200 select-none",
               isSelected 
                 ? "border-3 border-amber-500 shadow-xl ring-4 ring-amber-100/90 -translate-y-1 bg-gradient-to-r from-amber-50/50 via-white to-orange-50/30" 
                 : "border-2 border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-md bg-white hover:-translate-y-0.5"
            )}
          >
            {/* Selected Badge */}
            {isSelected && (
              <div className="absolute top-4 right-4">
                <div className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs rounded-full flex items-center gap-1.5 shadow-sm border border-amber-600">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>ĐÃ CHỌN GỢI Ý NÀY</span>
                </div>
              </div>
            )}
            
            <div className={cn(
              "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex shrink-0 items-center justify-center text-3xl sm:text-4xl shadow-md bg-gradient-to-br text-white transition-transform group-hover:scale-105",
              bgGradient
            )}>
              {game.icon || "🎲"}
            </div>
            
            <div className="flex-1 text-left pr-4">
               <div className="flex flex-wrap items-center gap-2 mb-2">
                 <h3 className="font-black text-lg sm:text-xl text-slate-900 group-hover:text-indigo-600 transition-colors">
                   {game.loai}
                 </h3>
                 <span className={cn(
                   "px-2.5 py-0.5 text-[11px] font-black rounded-full uppercase shadow-2xs",
                   game.doKho === 'Dễ' ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : 
                   game.doKho === 'Trung bình' ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-rose-100 text-rose-800 border border-rose-200"
                 )}>
                   {game.doKho}
                 </span>
                 <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-[11px] font-black rounded-full border border-indigo-200 flex items-center gap-1">
                   <Clock className="w-3 h-3 text-indigo-600" /> {game.thoiGian}
                 </span>
               </div>
               <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                 {game.moTa}
               </p>
            </div>

            <div className="sm:self-center shrink-0 w-full sm:w-auto mt-2 sm:mt-0 flex justify-end">
              <button
                type="button"
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
                  isSelected
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 border border-slate-200"
                )}
              >
                {isSelected ? (
                  <>
                    <span>Đang chọn</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Chọn loại này</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
