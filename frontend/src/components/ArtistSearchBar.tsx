import React, { useEffect, useState, useRef } from 'react';
import { useUIStore, ArtistResult } from '../store/useUIStore';

// Fast external API fetcher for real artists (using iTunes Search API as a high-speed, no-auth proxy for top artists)
const searchExternalArtists = async (query: string): Promise<ArtistResult[]> => {
  if (!query) return [];
  try {
    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=musicArtist&limit=30`);
    const data = await response.json();
    
    const seenNames = new Set<string>();
    const uniqueArtists: ArtistResult[] = [];
    const normalizedQuery = query.toLowerCase().trim();
    
    for (const artist of data.results) {
      // Normalize the name to catch "Joon", "JOON", "joon", etc.
      const normalizedName = artist.artistName.toLowerCase().trim();
      
      // Strict matching: Ensure the artist name actually contains the search query.
      // This filters out irrelevant iTunes metadata matches (like returning a band when you search a member's name)
      if (normalizedName.includes(normalizedQuery)) {
        if (!seenNames.has(normalizedName)) {
          seenNames.add(normalizedName);
          uniqueArtists.push({
            id: artist.artistId.toString(),
            name: artist.artistName, // Preserve the original casing of the most popular result
          });
        }
      }
    }
    
    return uniqueArtists.slice(0, 10); // Return top 10 unique artists
  } catch (error) {
    console.error("Error fetching artists:", error);
    return [];
  }
};

const ArtistSearchBar: React.FC = () => {
  const { 
    searchQuery, setSearchQuery, 
    searchResults, setSearchResults, 
    isSearching, setIsSearching,
    selectedArtist, setSelectedArtist
  } = useUIStore();
  
  const [inputValue, setInputValue] = useState(searchQuery);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search effect
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (inputValue.trim().length > 0 && inputValue !== selectedArtist?.name) {
        setIsSearching(true);
        const results = await searchExternalArtists(inputValue);
        setSearchResults(results);
        setIsSearching(false);
        setShowDropdown(true);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, selectedArtist?.name, setSearchResults, setIsSearching]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setSearchQuery(e.target.value);
    if (selectedArtist) {
      setSelectedArtist(null); // Reset selection if they start typing again
    }
  };

  const handleSelectArtist = (artist: ArtistResult) => {
    setSelectedArtist(artist);
    setInputValue(artist.name);
    setSearchQuery(artist.name);
    setSearchResults([]);
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full max-w-md mx-auto" ref={dropdownRef}>
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
          placeholder="Search for an artist..."
          className="relative w-full bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 text-slate-200 px-5 py-3.5 rounded-lg focus:outline-none focus:border-emerald-500/50 transition-all shadow-xl placeholder:text-slate-500 font-medium"
        />
        {isSearching && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2 z-10">
            <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {showDropdown && searchResults.length > 0 && (
        <div className="absolute mt-2 w-full z-[100] bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-lg overflow-hidden shadow-2xl">
          <ul className="max-h-60 overflow-y-auto">
            {searchResults.map((artist) => (
              <li 
                key={artist.id}
                onClick={() => handleSelectArtist(artist)}
                className="px-5 py-3.5 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-300 cursor-pointer transition-colors border-b border-slate-800/50 last:border-0 font-medium"
              >
                {artist.name}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {showDropdown && inputValue.trim().length > 0 && !isSearching && searchResults.length === 0 && (
        <div className="absolute mt-2 w-full z-[100] bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow-2xl p-5 text-center text-slate-500 font-medium">
          No artists found
        </div>
      )}
    </div>
  );
};

export default ArtistSearchBar;
