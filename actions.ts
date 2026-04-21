"use server";
import { supabase, type AppStatus } from "./supabase";

export async function getApplications() {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateStatus(id: string, status: AppStatus) {
  const { error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
