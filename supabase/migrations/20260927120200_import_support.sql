create unique index if not exists clients_owner_legacy_id_idx on quickscreen_v2.clients(owner_id, legacy_client_id) where legacy_client_id is not null;
create unique index if not exists assessments_owner_legacy_id_idx on quickscreen_v2.assessments(owner_id, legacy_assessment_id) where legacy_assessment_id is not null;
