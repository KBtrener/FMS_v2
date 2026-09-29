drop index if exists quickscreen_v2.clients_owner_legacy_id_idx;
drop index if exists quickscreen_v2.assessments_owner_legacy_id_idx;
alter table quickscreen_v2.clients add constraint clients_owner_legacy_id_key unique (owner_id, legacy_client_id);
alter table quickscreen_v2.assessments add constraint assessments_owner_legacy_id_key unique (owner_id, legacy_assessment_id);
