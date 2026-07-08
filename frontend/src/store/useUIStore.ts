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
  };
}

interface UIStore {
  hudState: HUDState;
  targetVector: number[]; // 1500d array
  currentUmapCoords: [number, number];
  isReconnecting: boolean;
  
  // Manifold state
  cameraTarget: [number, number, number];
  nodes: NodeData[];
  activeNodeId: string | null;

  // Search state
  searchQuery: string;
  searchResults: ArtistResult[];
  isSearching: boolean;
  selectedArtist: ArtistResult | null;

  // Actions
  setHUDState: (newState: Partial<HUDState>) => void;
  setTargetVector: (vector: number[]) => void;
  setCurrentUmapCoords: (coords: [number, number]) => void;
  setIsReconnecting: (reconnecting: boolean) => void;
  setCameraTarget: (target: [number, number, number]) => void;
  setNodes: (nodes: NodeData[]) => void;
  setActiveNode: (id: string | null, triggerAudio: boolean) => void;

  // Search Actions
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: ArtistResult[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setSelectedArtist: (artist: ArtistResult | null) => void;
}

// Generate some mock nodes for testing the InstancedMesh
const generateMockNodes = (count: number): NodeData[] => {
  return Array.from({ length: count }).map((_, i) => ({
    spotify_track_id: `mock_track_${i}`,
    umap_x: (Math.random() - 0.5) * 100,
    umap_y: (Math.random() - 0.5) * 100,
    is_active: false,
    distance_l2: Math.random() * 10,
    metadata: {
      artist_name: `Topological Artist ${i}`,
      track_title: `Geodesic Anomaly ${i}`,
      // 50% chance of a dead link to test error handling
      preview_url: Math.random() > 0.5 ? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' : 'invalid_url.mp3',
      album_art_url: `https://picsum.photos/seed/${i}/100/100`,
    }
  }));
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
  
  cameraTarget: [0, 0, 50],
  nodes: generateMockNodes(10000), // Renders 10,000 independent vector nodes
  activeNodeId: null,

  searchQuery: '',
  searchResults: [],
  isSearching: false,
  selectedArtist: null,

  setHUDState: (newState) => 
    set((state) => ({ hudState: { ...state.hudState, ...newState } })),
  setTargetVector: (vector) => set({ targetVector: vector }),
  setCurrentUmapCoords: (coords) => set({ currentUmapCoords: coords }),
  setIsReconnecting: (reconnecting) => set({ isReconnecting: reconnecting }),
  setCameraTarget: (target) => set({ cameraTarget: target }),
  setNodes: (nodes) => set({ nodes }),
  setActiveNode: (id, triggerAudio) => set({ activeNodeId: id }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setSelectedArtist: (artist) => set({ selectedArtist: artist }),
}))
