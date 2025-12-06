// ===========================
// USERS
// ===========================
export interface User {
  username: string;
  email: string;
  photoURL: string | null;
  bio: string;
  gender: "male" | "female" | "other" | null;
  workplace?: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;

  settings?: {
    notifEnabled: boolean;
  };
}

// ===========================
// NOTIFICATIONS
// (users/{userId}/notifications/{notifId})
// ===========================
export interface Notification {
  type: "comment" | "reply" | "like" | "invite";
  postId: string;
  senderId: string;
  read: boolean;
  createdAt: Date;
}

// ===========================
// POSTS
// ===========================
export interface Post {
  authorId: string;
  title: string;
  summary: string;
  categoryId: string;   // matches /categories/{id}
  coverImage: string;
  contentUrl: string;
  contentType: "txt" | "md" | "pdf" | "doc" | "docx";
  createdAt: Date;
  updatedAt: Date;
  likeCount: number;
  commentCount: number;
  isPublished: boolean;
}

// ===========================
// COMMENTS
// ===========================
export interface Comment {
  authorId: string;
  content: string;
  createdAt: Date;
  likeCount: number;
}

// Replies behave the same = nested under comments
export interface Reply {
  authorId: string;
  content: string;
  createdAt: Date;
  likeCount: number;
}

// ===========================
// CATEGORIES (fixed category list)
// ===========================
export interface Category {
  id: string;              // e.g. "science"
  name: string;            // e.g. "Science"
}

export const PRESET_CATEGORIES = [
  { id: "science", name: "Science" },
  { id: "technology", name: "Technology" },
  { id: "engineering", name: "Engineering" },
  { id: "mathematics", name: "Mathematics" },
  { id: "health_medicine", name: "Health & Medicine" },
  { id: "business_economics", name: "Business & Economics" },
  { id: "social_sciences", name: "Social Sciences" },
  { id: "humanities", name: "Humanities" },
  { id: "education", name: "Education" },
  { id: "environment_sustainability", name: "Environment & Sustainability" }
];

// ===========================
// COMMUNITIES
// ===========================
export interface Community {
  name: string;
  description: string;
  ownerId: string;
  isPrivate: boolean;
  createdAt: Date;
  memberCount: number;
}

export interface CommunityMember {
  role: "owner" | "admin" | "member";
  joinedAt: Date;
}

export interface CommunityMessage {
  senderId: string;
  content: string;
  createdAt: Date;
}

// ===========================
// FAVORITES
// ===========================
export interface FavoritePost {
  favoritedAt: Date;
}

// ===========================
// LIKES
// ===========================
export interface LikeUser {
  likedAt: Date;
}

// ===========================
// HISTORY
// ===========================
export interface HistoryEntry {
  viewedAt: Date;
}
