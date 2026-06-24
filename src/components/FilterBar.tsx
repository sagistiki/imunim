import React, { useState } from 'react';
import { Search, Heart, SlidersHorizontal, X, ChevronDown, Check } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  
  selectedMuscles: string[];
  setSelectedMuscles: (muscles: string[]) => void;
  allMuscles: string[];
  
  selectedEquipment: string[];
  setSelectedEquipment: (equip: string[]) => void;
  allEquipment: string[];
  
  isBodyweightOnly: boolean;
  setIsBodyweightOnly: (bw: boolean) => void;
  
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  allCategories: string[];
  
  selectedLevel: string;
  setSelectedLevel: (level: string) => void;
  allLevels: string[];
  
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (fav: boolean) => void;
  
  totalResultsCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedMuscles,
  setSelectedMuscles,
  allMuscles,
  selectedEquipment,
  setSelectedEquipment,
  allEquipment,
  isBodyweightOnly,
  setIsBodyweightOnly,
  selectedCategory,
  setSelectedCategory,
  allCategories,
  selectedLevel,
  setSelectedLevel,
  allLevels,
  showFavoritesOnly,
  setShowFavoritesOnly,
  totalResultsCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePopover, setActivePopover] = useState<'muscle' | 'equipment' | null>(null);

  const toggleMuscle = (muscle: string) => {
    if (selectedMuscles.includes(muscle)) {
      setSelectedMuscles(selectedMuscles.filter((m) => m !== muscle));
    } else {
      setSelectedMuscles([...selectedMuscles, muscle]);
    }
  };

  const toggleEquipment = (equip: string) => {
    if (selectedEquipment.includes(equip)) {
      setSelectedEquipment(selectedEquipment.filter((e) => e !== equip));
    } else {
      setSelectedEquipment([...selectedEquipment, equip]);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedMuscles([]);
    setSelectedEquipment([]);
    setIsBodyweightOnly(false);
    setSelectedCategory('');
    setSelectedLevel('');
    setShowFavoritesOnly(false);
  };

  const hasActiveFilters = 
    searchQuery !== '' || 
    selectedMuscles.length > 0 || 
    selectedEquipment.length > 0 || 
    isBodyweightOnly || 
    selectedCategory !== '' || 
    selectedLevel !== '' || 
    showFavoritesOnly;

  return (
    <div className="sticky top-0 z-40 w-full glass-panel border-b border-gray-800/80 shadow-lg px-4 py-3">
      <div className="max-w-6xl mx-auto space-y-3">
        
        {/* Main Search Row */}
        <div className="flex items-center gap-2">
          {/* Search Input Container */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full bg-gray-900/90 py-2.5 pl-10 pr-10 text-sm text-white placeholder-gray-500 border border-gray-800 focus:border-[#06b6d4]/50 focus:outline-none focus:ring-1 focus:ring-[#06b6d4]/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Toggle Expand Filters Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
              isExpanded 
                ? 'bg-[#06b6d4]/20 border-[#06b6d4]/40 text-[#22d3ee]' 
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
            }`}
            aria-label="Filter options"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>

          {/* Quick Favorite Only Button */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex h-10 px-4 items-center gap-1.5 rounded-full border transition-all text-xs font-semibold ${
              showFavoritesOnly
                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Heart className={`h-4 w-4 ${showFavoritesOnly ? 'fill-red-500 text-red-400' : ''}`} />
            <span className="hidden sm:inline">Favorites</span>
          </button>
        </div>

        {/* Quick Toggles Row (Always Visible) */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Bodyweight Toggle */}
            <button
              onClick={() => setIsBodyweightOnly(!isBodyweightOnly)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-xs font-bold transition-all ${
                isBodyweightOnly
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                  : 'bg-gray-900/60 border-gray-800/80 text-gray-300 hover:border-gray-700'
              }`}
            >
              <span>💪 Bodyweight Only</span>
            </button>

            {/* Active Muscle Count Tag */}
            {selectedMuscles.length > 0 && (
              <span className="inline-flex items-center gap-1 bg-[#06b6d4]/10 border border-[#06b6d4]/20 text-[#22d3ee] rounded-full pl-3 pr-2 py-1 text-xs font-semibold">
                {selectedMuscles.length} Muscles
                <button onClick={() => setSelectedMuscles([])} className="hover:text-white ml-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Active Equipment Count Tag */}
            {selectedEquipment.length > 0 && (
              <span className="inline-flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full pl-3 pr-2 py-1 text-xs font-semibold">
                {selectedEquipment.length} Equipment
                <button onClick={() => setSelectedEquipment([])} className="hover:text-white ml-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Reset Filters Option */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-gray-400 hover:text-white font-medium underline underline-offset-2 ml-1"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="text-xs text-gray-500 font-semibold font-sans">
            {totalResultsCount} exercises
          </div>
        </div>

        {/* Collapsible Advanced Filters Section */}
        {isExpanded && (
          <div className="pt-2 border-t border-gray-850 grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in relative z-50">
            
            {/* Muscles Multiselect Dropdown */}
            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Target Muscle</label>
              <button
                onClick={() => setActivePopover(activePopover === 'muscle' ? null : 'muscle')}
                className="w-full flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white hover:border-gray-700"
              >
                <span className="truncate">
                  {selectedMuscles.length === 0 
                    ? 'All Muscles' 
                    : `${selectedMuscles.length} selected`}
                </span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </button>
              {activePopover === 'muscle' && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setActivePopover(null)} />
                  <div className="absolute left-0 mt-1.5 w-56 max-h-60 overflow-y-auto rounded-xl bg-gray-950 border border-gray-800 shadow-xl z-20 p-1.5 scrollbar-thin">
                    {allMuscles.map((muscle) => {
                      const isSelected = selectedMuscles.includes(muscle);
                      return (
                        <button
                          key={muscle}
                          onClick={() => toggleMuscle(muscle)}
                          className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs text-left capitalize ${
                            isSelected ? 'bg-[#06b6d4]/10 text-cyan-400' : 'text-gray-300 hover:bg-gray-900'
                          }`}
                        >
                          <span>{muscle}</span>
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Equipment Multiselect Dropdown */}
            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Equipment</label>
              <button
                onClick={() => setActivePopover(activePopover === 'equipment' ? null : 'equipment')}
                className="w-full flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white hover:border-gray-700"
              >
                <span className="truncate">
                  {selectedEquipment.length === 0 
                    ? 'All Equipment' 
                    : `${selectedEquipment.length} selected`}
                </span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </button>
              {activePopover === 'equipment' && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setActivePopover(null)} />
                  <div className="absolute left-0 mt-1.5 w-56 max-h-60 overflow-y-auto rounded-xl bg-gray-950 border border-gray-800 shadow-xl z-20 p-1.5 scrollbar-thin">
                    {allEquipment.map((equip) => {
                      const isSelected = selectedEquipment.includes(equip);
                      return (
                        <button
                          key={equip}
                          onClick={() => toggleEquipment(equip)}
                          className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs text-left capitalize ${
                            isSelected ? 'bg-indigo-500/10 text-indigo-400' : 'text-gray-300 hover:bg-gray-900'
                          }`}
                        >
                          <span>{equip}</span>
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gray-700 capitalize"
              >
                <option value="">All Categories</option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Level Dropdown */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Difficulty</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gray-700 capitalize"
              >
                <option value="">All Levels</option>
                {allLevels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
