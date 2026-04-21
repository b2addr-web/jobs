-- Run this in Supabase SQL Editor

create table if not exists applications (
  id          uuid default gen_random_uuid() primary key,
  full_name   text not null,
  email       text not null,
  job_title   text not null,
  resume_url  text,
  status      text default 'pending' check (status in ('pending','shortlisted','rejected')),
  created_at  timestamptz default now()
);

alter table applications enable row level security;
create policy "allow_all" on applications for all using (true) with check (true);

-- Sample data
insert into applications (full_name, email, job_title, status) values
  ('Ahmed Al-Rashidi',  'ahmed@example.com',   'Network Engineer',       'pending'),
  ('Sara Al-Qahtani',   'sara@example.com',    'Cloud Architect',        'shortlisted'),
  ('Khalid Al-Mutairi', 'khalid@example.com',  'DevOps Engineer',        'pending'),
  ('Fatima Al-Dosari',  'fatima@example.com',  'Cybersecurity Analyst',  'rejected'),
  ('Omar Al-Harbi',     'omar@example.com',    'Software Developer',     'pending');
