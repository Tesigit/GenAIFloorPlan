import React from 'react';
import { Settings, ChevronDown, Minus, Plus, RefreshCw } from 'lucide-react';

export interface FloorConfigData {
  bedrooms: string;
  bathrooms: string;
  kitchens: string;
  livingRooms: string;
  balconies: string;
  parking: boolean;
  hasLift: boolean;
}

export interface FormData {
  length: string;
  width: string;
  floors: string;
  floorDetails: FloorConfigData[];
  specialRequirements: string[];
  stylePreference: string;
  prompt: string;
}

interface InputFormProps {
  formData: FormData;
  onChange: (data: FormData) => void;
  isSidebarMode?: boolean;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

/**
 * Compact emoji icon card for room count stepper.
 * Fits in 3-column grid inside a ~220px sidebar.
 */
const RoomCard: React.FC<{
  icon: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}> = ({ icon, label, value, min, max, onChange }) => (
  <div className="flex flex-col bg-black/30 rounded-lg border border-white/[0.06] hover:border-white/[0.14] transition-all p-1.5 gap-1.5">
    <div className="flex items-center gap-1">
      <span className="text-sm leading-none">{icon}</span>
      <span className="text-[9px] text-gray-400 font-medium truncate leading-none">{label}</span>
    </div>
    <div className="flex items-center justify-between gap-0.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-5 h-5 rounded bg-white/5 hover:bg-white/15 disabled:opacity-25 flex items-center justify-center border border-white/[0.08] active:scale-95 transition-all flex-shrink-0"
      >
        <Minus className="w-2.5 h-2.5 text-white/70" />
      </button>
      <span className="text-sm font-bold text-white tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-5 h-5 rounded bg-white/5 hover:bg-blue-500/25 disabled:opacity-25 flex items-center justify-center border border-white/[0.08] hover:border-blue-400/30 active:scale-95 transition-all flex-shrink-0"
      >
        <Plus className="w-2.5 h-2.5 text-white/70" />
      </button>
    </div>
  </div>
);

const InputForm: React.FC<InputFormProps> = ({
  formData,
  onChange,
  isSidebarMode = false,
  onGenerate,
  isGenerating = false,
}) => {
  const [activeFloorTab, setActiveFloorTab] = React.useState(0);

  const updateField = (field: keyof FormData, value: string) => {
    onChange({ ...formData, [field]: value });
  };
  
  const updateFloorInt = (field: keyof FloorConfigData, value: number) => {
    if (!formData.floorDetails || !formData.floorDetails[activeFloorTab]) return;
    const newDetails = [...formData.floorDetails];
    newDetails[activeFloorTab] = { ...newDetails[activeFloorTab], [field]: String(value) };
    onChange({ ...formData, floorDetails: newDetails });
  };

  const toggleParking = () => {
    if (!formData.floorDetails || !formData.floorDetails[activeFloorTab]) return;
    const newDetails = [...formData.floorDetails];
    newDetails[activeFloorTab] = { ...newDetails[activeFloorTab], parking: !newDetails[activeFloorTab].parking };
    onChange({ ...formData, floorDetails: newDetails });
  };

  const toggleLift = () => {
    if (!formData.floorDetails || !formData.floorDetails[activeFloorTab]) return;
    const newDetails = [...formData.floorDetails];
    const newVal = !newDetails[activeFloorTab].hasLift;
    newDetails.forEach(fd => fd.hasLift = newVal);
    onChange({ ...formData, floorDetails: newDetails });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onGenerate) onGenerate();
  };

  const formContent = (
    <form onSubmit={handleSubmit} className={`space-y-3 ${isSidebarMode ? '' : 'mt-0'}`}>
      {/* Plot Size */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-semibold text-blue-200/60 uppercase tracking-widest">Plot Size</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { field: 'length', placeholder: 'Length' },
            { field: 'width', placeholder: 'Width' },
          ].map(({ field, placeholder }) => (
            <div key={field} className="relative">
              <input
                type="number" min={3} max={100} required
                value={formData[field as keyof FormData] as string}
                onChange={(e) => updateField(field as keyof FormData, e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:ring-1 focus:ring-blue-500/50 outline-none transition-all pr-8 hover:border-white/20"
                placeholder={placeholder}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 text-xs pointer-events-none">m</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rooms Config */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-semibold text-blue-200/60 uppercase tracking-widest flex justify-between items-center">
          <span>Rooms Setup</span>
        </label>
        
        {/* Total Floors Controller embedded here */}
        <div className="grid grid-cols-1 mb-2">
            <RoomCard icon="🏢" label="Total Floors Structure" value={parseInt(formData.floors || '1')} min={1} max={3} onChange={(v) => {
              const newDetails = formData.floorDetails ? [...formData.floorDetails] : [];
              while(newDetails.length < v) {
                newDetails.push({ bedrooms: '2', bathrooms: '1', kitchens: '0', livingRooms: '1', balconies: '1', parking: false, hasLift: newDetails[0]?.hasLift || false });
              }
              onChange({ ...formData, floors: String(v), floorDetails: newDetails.slice(0, v) });
              if (activeFloorTab >= v) setActiveFloorTab(v - 1);
            }} />
        </div>

        {/* Floor Tabs if Multi-Floor */}
        {parseInt(formData.floors || '1') > 1 && (
           <div className="flex gap-1 mb-2 bg-black/30 p-1 rounded-lg">
             {Array.from({length: parseInt(formData.floors || '1')}).map((_, i) => (
                <button 
                  key={i} type="button" 
                  onClick={() => setActiveFloorTab(i)}
                  className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${activeFloorTab === i ? 'bg-blue-600 shadow-md text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  {i === 0 ? 'Ground' : `Floor ${i}`}
                </button>
             ))}
           </div>
        )}

        <div className="grid grid-cols-3 gap-1.5">
          {formData.floorDetails && formData.floorDetails[activeFloorTab] && (
            <>
              <RoomCard icon="🛏️" label="Bedrooms" value={parseInt(formData.floorDetails[activeFloorTab].bedrooms)} min={1} max={5} onChange={(v) => updateFloorInt('bedrooms', v)} />
              <RoomCard icon="🚿" label="Bathrooms" value={parseInt(formData.floorDetails[activeFloorTab].bathrooms)} min={1} max={5} onChange={(v) => updateFloorInt('bathrooms', v)} />
              <RoomCard icon="🍳" label="Kitchens" value={parseInt(formData.floorDetails[activeFloorTab].kitchens)} min={0} max={2} onChange={(v) => updateFloorInt('kitchens', v)} />
              <RoomCard icon="🛋️" label="Living" value={parseInt(formData.floorDetails[activeFloorTab].livingRooms)} min={0} max={2} onChange={(v) => updateFloorInt('livingRooms', v)} />
              <RoomCard icon="🌿" label="Balcony" value={parseInt(formData.floorDetails[activeFloorTab].balconies)} min={0} max={3} onChange={(v) => updateFloorInt('balconies', v)} />
            </>
          )}
        </div>
        
        {/* Parking and Lift Toggles */}
        {activeFloorTab === 0 && formData.floorDetails && formData.floorDetails[0] && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-black/30 rounded-lg border border-white/[0.06] p-2 flex justify-between items-center cursor-pointer hover:border-white/[0.14] transition-all" onClick={toggleParking}>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🚗</span>
                <span className="text-[9px] text-gray-300 font-medium uppercase tracking-wider">Parking</span>
              </div>
              <div className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors duration-300 ${formData.floorDetails[0].parking ? 'bg-blue-500' : 'bg-gray-700'}`}>
                <div className={`bg-white w-3 h-3 rounded-full shadow-md transform duration-300 ${formData.floorDetails[0].parking ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>

            <div className="bg-black/30 rounded-lg border border-white/[0.06] p-2 flex justify-between items-center cursor-pointer hover:border-white/[0.14] transition-all" onClick={toggleLift}>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🛗</span>
                <span className="text-[9px] text-gray-300 font-medium uppercase tracking-wider">Elevator</span>
              </div>
              <div className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors duration-300 ${formData.floorDetails[0].hasLift ? 'bg-blue-500' : 'bg-gray-700'}`}>
                <div className={`bg-white w-3 h-3 rounded-full shadow-md transform duration-300 ${formData.floorDetails[0].hasLift ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Directives */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-semibold text-blue-200/60 uppercase tracking-widest">AI Directives</label>
        <div className="relative">
          <select
            value={formData.stylePreference}
            onChange={(e) => updateField('stylePreference', e.target.value)}
            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-medium outline-none cursor-pointer appearance-none hover:border-white/20 transition-all focus:ring-1 focus:ring-purple-500/40"
          >
            <option value="modern" className="bg-slate-900">✦ Modern Open-Plan</option>
            <option value="minimalist" className="bg-slate-900">◈ Minimalist Compact</option>
            <option value="traditional" className="bg-slate-900">⊕ Traditional Indian (Vastu)</option>
            <option value="luxury" className="bg-slate-900">✦ Luxury Oversized</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
        </div>

        <textarea
          value={formData.prompt}
          onChange={(e) => updateField('prompt', e.target.value)}
          rows={isSidebarMode ? 2 : 3}
          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs placeholder-white/20 focus:ring-1 focus:ring-purple-500/40 outline-none transition-all resize-none hover:border-white/20"
          placeholder="e.g. 'pooja room', 'open kitchen', 'parking', 'study room'..."
        />
      </div>

      {/* Generate Button (only in non-sidebar mode) */}
      {!isSidebarMode && (
        <button
          type="submit"
          disabled={isGenerating}
          className={`w-full py-3 rounded-xl font-bold text-white transition-all duration-300 text-sm shadow-lg ${isGenerating
              ? 'bg-gray-700 cursor-not-allowed opacity-60'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:shadow-indigo-500/25 ring-1 ring-white/20 hover:scale-[1.02] active:scale-[0.99]'
            }`}
        >
          {isGenerating ? 'Designing Plan...' : 'Generate Floor Plan'}
        </button>
      )}
    </form>
  );

  /* ── SIDEBAR MODE: flex-col with sticky bottom button ── */
  if (isSidebarMode) {
    return (
      <div className="flex flex-col h-full bg-slate-950/60">
        {/* Scrollable parameters */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 pb-1 min-h-0">
          <div className="flex items-center space-x-2 mb-3 opacity-90">
            <div className="p-1.5 bg-white/5 rounded-md border border-white/10">
              <Settings className="w-4 h-4 text-blue-300" />
            </div>
            <h2 className="text-xs font-bold text-white tracking-widest uppercase">Parameters</h2>
          </div>
          {formContent}
        </div>

        {/* Sticky bottom button */}
        <div className="flex-shrink-0 p-3 border-t border-white/[0.06] bg-slate-950/90 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => onGenerate && onGenerate()}
            disabled={isGenerating}
            className={`w-full py-2.5 rounded-xl font-bold text-white text-sm transition-all duration-300 flex items-center justify-center gap-2 ${isGenerating
                ? 'bg-gray-700 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 ring-1 ring-white/20 active:scale-[0.99] shadow-lg shadow-blue-500/20'
              }`}
          >
            {isGenerating ? (
              <>
                <span className="animate-spin w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />
                Designing...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                New Variation
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  /* ── STANDALONE MODE ── */
  return (
    <div className="bg-slate-900/40 rounded-2xl p-4 border border-white/[0.04] shadow-2xl w-full max-w-lg mx-auto mt-8">
      <div className="flex items-center space-x-2 mb-4 opacity-90">
        <div className="p-1.5 bg-white/5 rounded-md border border-white/10">
          <Settings className="w-4 h-4 text-blue-300" />
        </div>
        <h2 className="text-sm font-bold text-white tracking-widest uppercase">Parameters</h2>
      </div>
      {formContent}
    </div>
  );
};

export default InputForm;