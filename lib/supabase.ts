import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

// Lazy-initialized Supabase client
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  
  return supabaseClient;
}

// Mock auth methods for when Supabase is not configured
const mockError = { error: new Error("Supabase not configured") };
const mockAuthMethods = {
  getSession: async () => ({ data: { session: null }, error: null }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  signInWithOAuth: async () => mockError,
  signInWithPassword: async () => mockError,
  signUp: async () => mockError,
  signOut: async () => ({ error: null }),
  exchangeCodeForSession: async () => ({ error: null }),
  resetPasswordForEmail: async () => mockError,
};

// For backward compatibility, export a getter
export const supabase = {
  get auth() {
    const client = getSupabaseClient();
    if (!client) {
      return mockAuthMethods;
    }
    return client.auth;
  },
};

export default supabase;
