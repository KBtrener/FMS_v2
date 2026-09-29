-- Per-test trainer observations and explicit assessment photo mapping.
-- The migration is additive: existing attachments remain general documents.

alter table quickscreen_v2.attachments
  add column if not exists test_id text references quickscreen_v2.tests(test_id) on delete set null,
  add column if not exists attachment_role text not null default 'document';

alter table quickscreen_v2.attachments
  drop constraint if exists attachments_attachment_role_check;

alter table quickscreen_v2.attachments
  add constraint attachments_attachment_role_check
  check (attachment_role in ('document', 'test_photo'));

create index if not exists attachments_assessment_test_idx
  on quickscreen_v2.attachments(assessment_id, test_id)
  where attachment_role = 'test_photo';

create table if not exists quickscreen_v2.assessment_test_notes (
  assessment_test_note_id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references quickscreen_v2.assessments(assessment_id) on delete cascade,
  test_id text not null references quickscreen_v2.tests(test_id) on delete cascade,
  author_id uuid not null references quickscreen_v2.profiles(id) on delete restrict default auth.uid(),
  note text not null check (char_length(trim(note)) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, test_id)
);

create index if not exists assessment_test_notes_assessment_idx
  on quickscreen_v2.assessment_test_notes(assessment_id);

alter table quickscreen_v2.assessment_test_notes enable row level security;

drop policy if exists assessment_test_notes_select_access on quickscreen_v2.assessment_test_notes;
create policy assessment_test_notes_select_access on quickscreen_v2.assessment_test_notes
for select to authenticated using (
  exists (
    select 1 from quickscreen_v2.assessments a
    where a.assessment_id = assessment_test_notes.assessment_id
      and quickscreen_v2.can_access_client(a.client_id)
  )
);

drop policy if exists assessment_test_notes_insert_access on quickscreen_v2.assessment_test_notes;
create policy assessment_test_notes_insert_access on quickscreen_v2.assessment_test_notes
for insert to authenticated with check (
  author_id = auth.uid() and exists (
    select 1 from quickscreen_v2.assessments a
    where a.assessment_id = assessment_test_notes.assessment_id
      and quickscreen_v2.can_access_client(a.client_id)
  )
);

drop policy if exists assessment_test_notes_update_access on quickscreen_v2.assessment_test_notes;
create policy assessment_test_notes_update_access on quickscreen_v2.assessment_test_notes
for update to authenticated using (
  exists (
    select 1 from quickscreen_v2.assessments a
    where a.assessment_id = assessment_test_notes.assessment_id
      and quickscreen_v2.can_access_client(a.client_id)
  )
) with check (
  author_id = auth.uid() and exists (
    select 1 from quickscreen_v2.assessments a
    where a.assessment_id = assessment_test_notes.assessment_id
      and quickscreen_v2.can_access_client(a.client_id)
  )
);

drop policy if exists assessment_test_notes_delete_access on quickscreen_v2.assessment_test_notes;
create policy assessment_test_notes_delete_access on quickscreen_v2.assessment_test_notes
for delete to authenticated using (
  exists (
    select 1 from quickscreen_v2.assessments a
    where a.assessment_id = assessment_test_notes.assessment_id
      and quickscreen_v2.can_access_client(a.client_id)
  )
);

grant select, insert, update, delete on quickscreen_v2.assessment_test_notes to authenticated;

create or replace function quickscreen_v2.set_assessment_test_note_updated_at()
returns trigger language plpgsql set search_path = quickscreen_v2, public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists assessment_test_notes_updated_at on quickscreen_v2.assessment_test_notes;
create trigger assessment_test_notes_updated_at
before update on quickscreen_v2.assessment_test_notes
for each row execute function quickscreen_v2.set_assessment_test_note_updated_at();
