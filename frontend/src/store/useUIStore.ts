import { create } from 'zustand'

export interface ArtistResult {
  id: string;
  name: string;
}

export interface HUDState {
  timbral_density_h0: number;
  cyclic_frequency_h1: number;
  transient_sharpness: number;
}

export interface NodeData {
  spotify_track_id: string;
  umap_x: number;
  umap_y: number;
  is_active: boolean;
  distance_l2: number;
  metadata: {
    artist_name: string;
    track_title: string;
    preview_url: string;
    album_art_url: string;
    release_date?: string;
    genre?: string;
    play_count?: number;
  };
}

interface UIStore {
  hudState: HUDState;
  targetVector: number[]; // 1500d array
  currentUmapCoords: [number, number];
  isReconnecting: boolean;
  isAppLaunched: boolean;

  // Manifold state
  cameraTarget: [number, number, number];
  nodes: NodeData[];
  activeNodeId: string | null;
  hoveredNode: { data: NodeData; x: number; y: number } | null;

  // Search state
  searchQuery: string;
  searchResults: ArtistResult[];
  isSearching: boolean;
  selectedArtist: ArtistResult | null;

  // Actions
  setIsAppLaunched: (launched: boolean) => void;
  setHUDState: (newState: Partial<HUDState>) => void;
  setTargetVector: (vector: number[]) => void;
  setCurrentUmapCoords: (coords: [number, number]) => void;
  setIsReconnecting: (reconnecting: boolean) => void;
  setCameraTarget: (target: [number, number, number]) => void;
  setNodes: (nodes: NodeData[]) => void;
  setActiveNode: (id: string | null, triggerAudio: boolean) => void;
  setHoveredNode: (node: { data: NodeData; x: number; y: number } | null) => void;

  // Search Actions
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: ArtistResult[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setSelectedArtist: (artist: ArtistResult | null) => void;
}

const REAL_ARTISTS = [
  "Aphex Twin", "Boards of Canada", "Brian Eno", "Burial", "Four Tet", 
  "Autechre", "Jon Hopkins", "Nils Frahm", "Floating Points", "Bonobo",
  "Flying Lotus", "Massive Attack", "Portishead", "Björk", "Radiohead",
  "Arca", "SOPHIE", "FKA twigs", "Yves Tumor", "Oneohtrix Point Never",
  "Tim Hecker", "William Basinski", "Steve Reich", "Philip Glass",
  "John Coltrane", "Miles Davis", "Thelonious Monk", "Charles Mingus",
  "MF DOOM", "Madvillain", "J Dilla", "Knxwledge", "Earl Sweatshirt"
];

const REAL_TITLES = [
  "Windowlicker", "Dayvan Cowboy", "1/1", "Archangel", "New Energy",
  "Gantz Graf", "Immunity", "Says", "Kuiper", "Cirrus",
  "Cosmogramma", "Teardrop", "Glory Box", "Army of Me", "Idioteque",
  "KiCk i", "Faceshopping", "Cellophane", "Gospel For A New Century", "Boring Angel",
  "Virgins", "The Disintegration Loops", "Music for 18 Musicians", "Glassworks",
  "A Love Supreme", "So What", "Round Midnight", "Goodbye Pork Pie Hat",
  "Rhinestone Cowboy", "Accordion", "Donuts", "Hud Dreems", "Chum"
];

const GENRES = [
  "IDM", "Ambient", "Electronic", "Experimental", "Trip Hop", 
  "Jazz", "Avant-Garde", "Abstract Hip Hop", "Glitch", "Minimalism",
  "Post-Rock", "Shoegaze", "Drone", "Neo-Classical", "Art Pop"
];

// Generate nodes with realistic data
const generateRealNodes = (count: number): NodeData[] => {
  return Array.from({ length: count }).map((_, i) => {
    const artist = REAL_ARTISTS[Math.floor(Math.random() * REAL_ARTISTS.length)];
    const title = REAL_TITLES[Math.floor(Math.random() * REAL_TITLES.length)];
    const genre = GENRES[Math.floor(Math.random() * GENRES.length)];
    
    // Simulate clustering by assigning base coordinates based on genre index
    const genreIndex = GENRES.indexOf(genre);
    const angle = (genreIndex / GENRES.length) * Math.PI * 2;
    const radius = 20 + Math.random() * 60;
    
    return {
      spotify_track_id: `real_track_${i}`,
      umap_x: Math.cos(angle) * radius + (Math.random() - 0.5) * 15,
      umap_y: Math.sin(angle) * radius + (Math.random() - 0.5) * 15,
      is_active: false,
      distance_l2: Math.random() * 10,
      metadata: {
        artist_name: artist,
        track_title: title,
        preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Keeping valid preview for audio testing
        album_art_url: `https://picsum.photos/seed/${i}/100/100`,
        release_date: `${1990 + Math.floor(Math.random() * 34)}-0${Math.floor(Math.random() * 9) + 1}-15`,
        genre: genre,
        play_count: Math.floor(Math.random() * 1500000)
      }
    };
  });
};

export const useUIStore = create<UIStore>((set) => ({
  hudState: {
    timbral_density_h0: 0.5,
    cyclic_frequency_h1: 0.5,
    transient_sharpness: 0.5,
  },
  targetVector: new Array(1500).fill(0),
  currentUmapCoords: [0, 0],
  isReconnecting: false,
  isAppLaunched: false,
  
  cameraTarget: [0, 0, 50],
  nodes: generateRealNodes(10000), // Renders 10,000 independent vector nodes
  activeNodeId: null,
  hoveredNode: null,

  searchQuery: '',
  searchResults: [],
  isSearching: false,
  selectedArtist: null,

  setIsAppLaunched: (launched) => set({ isAppLaunched: launched }),
  setHUDState: (newState) => 
    set((state) => ({ hudState: { ...state.hudState, ...newState } })),
  setTargetVector: (vector) => set({ targetVector: vector }),
  setCurrentUmapCoords: (coords) => set({ currentUmapCoords: coords }),
  setIsReconnecting: (reconnecting) => set({ isReconnecting: reconnecting }),
  setCameraTarget: (target) => set({ cameraTarget: target }),
  setNodes: (nodes) => set({ nodes }),
  setActiveNode: (id, triggerAudio) => set({ activeNodeId: id }),
  setHoveredNode: (hoveredNode) => set({ hoveredNode }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setSelectedArtist: (artist) => set({ selectedArtist: artist }),
}))
