// ============================================
// I Cellar - Shared Types
// Mirrors DB schema for type safety
// ============================================

// --- Enums ---

export type UserRole = 'user' | 'admin' | 'shop_owner';
export type WineType = 'red' | 'white' | 'rose' | 'sparkling' | 'dessert' | 'fortified' | 'orange';
export type SpiritCategory = 'wine' | 'whiskey' | 'cognac' | 'sake' | 'beer' | 'other';
export type CollectionSource = 'manual' | 'photo' | 'search' | 'shop_purchase' | 'gift';
export type BadgeCategory = 'collection' | 'region' | 'variety' | 'social' | 'gathering' | 'special';
export type GatheringStatus = 'open' | 'closed' | 'cancelled' | 'completed';
export type MemberStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type NotificationType =
  | 'like' | 'comment' | 'follow'
  | 'badge_earned' | 'gathering_invite'
  | 'gathering_approved' | 'gathering_rejected'
  | 'shop_purchase';

// --- Core ---

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  is_verified: boolean;
  preferences: Record<string, unknown>;
  follower_count: number;
  following_count: number;
  post_count: number;
  collection_count: number;
  created_at: string;
  updated_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

// --- Wine ---

export interface Wine {
  id: number;
  category: SpiritCategory;
  name: string;
  name_ko: string | null;
  wine_type: WineType | null;
  producer: string | null;
  region: string | null;
  country: string | null;
  grape_variety: string[] | null;
  vintage_year: number | null;
  alcohol_pct: number | null;
  image_url: string | null;
  external_ref: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_by: string | null;
  verified: boolean;
  created_at: string;
}

// --- Collection ---

export interface Collection {
  id: number;
  user_id: string;
  wine_id: number;
  source: CollectionSource;
  quantity: number;
  purchase_price: number | null;
  purchase_date: string | null;
  drink_date: string | null;
  rating: number | null;
  tasting_note: string | null;
  is_public: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  wine?: Wine;
}

// --- Feed ---

export interface Post {
  id: number;
  user_id: string;
  caption: string | null;
  location: string | null;
  like_count: number;
  comment_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  images?: PostImage[];
  wines?: Wine[];
  user?: Profile;
  is_liked?: boolean;
}

export interface PostImage {
  id: number;
  post_id: number;
  image_url: string;
  display_order: number;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  parent_id: number | null;
  content: string;
  created_at: string;
  // Joined
  user?: Profile;
  replies?: Comment[];
}

// --- Gamification ---

export interface Badge {
  id: number;
  code: string;
  name: string;
  name_ko: string | null;
  description: string | null;
  icon_url: string | null;
  category: BadgeCategory;
  condition: Record<string, unknown>;
  tier: number;
  is_active: boolean;
  created_at: string;
}

export interface UserBadge {
  user_id: string;
  badge_id: number;
  earned_at: string;
  // Joined
  badge?: Badge;
}

// --- Gathering ---

export interface Gathering {
  id: number;
  host_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  location: string | null;
  gathering_date: string | null;
  max_members: number;
  current_members: number;
  status: GatheringStatus;
  theme_wines: number[] | null;
  price_per_person: number | null;
  external_chat_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  host?: Profile;
  members?: GatheringMember[];
}

export interface GatheringMember {
  gathering_id: number;
  user_id: string;
  status: MemberStatus;
  message: string | null;
  responded_at: string | null;
  // Joined
  user?: Profile;
}

// --- System ---

export interface Notification {
  id: number;
  user_id: string;
  type: NotificationType;
  title: string | null;
  body: string | null;
  reference_id: string | null;
  reference_type: string | null;
  actor_id: string | null;
  is_read: boolean;
  created_at: string;
  // Joined
  actor?: Profile;
}

// --- Ranking ---

export interface RankingEntry {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  unique_wines: number;
  total_bottles: number;
  countries: number;
  regions: number;
  badge_count: number;
  score: number;
}
