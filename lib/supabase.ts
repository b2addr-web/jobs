export async function updateStatus(id: string, status: ApplicationStatus) {
  const { data, error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
  return data;
}

// وتأكد أنك عرفت الـ types أيضاً إذا لم تكن موجودة
export type ApplicationStatus = 'pending' | 'shortlisted' | 'rejected';

export interface Application {
  id: string;
  full_name: string;
  email: string;
  job_title: string;
  resume_url: string;
  status: ApplicationStatus;
  created_at: string;
}
