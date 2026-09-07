drop index if exists public.clients_owner_legacy_id_idx;
drop index if exists public.assessments_owner_legacy_id_idx;
alter table public.clients add constraint clients_owner_legacy_id_key unique (owner_id, legacy_client_id);
alter table public.assessments add constraint assessments_owner_legacy_id_key unique (owner_id, legacy_assessment_id);
