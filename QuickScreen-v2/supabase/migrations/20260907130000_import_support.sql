create unique index if not exists clients_owner_legacy_id_idx on public.clients(owner_id, legacy_client_id) where legacy_client_id is not null;
create unique index if not exists assessments_owner_legacy_id_idx on public.assessments(owner_id, legacy_assessment_id) where legacy_assessment_id is not null;
