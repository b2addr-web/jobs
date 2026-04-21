import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnon);

export type AppStatus = "pending" | "shortlisted" | "rejected";

export interface Application {
  id:         string;
  full_name:  string;
  email:      string;
  job_title:  string;
  resume_url: string | null;
  status:     AppStatus;
  created_at?: string;
}
