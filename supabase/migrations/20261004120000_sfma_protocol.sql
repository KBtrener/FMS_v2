insert into quickscreen_v2.screen_types (screen_type_id,code,name,name_pl,name_en,is_active)
values ('screen_sfma','sfma','Selective Functional Movement Assessment','SFMA','SFMA',true)
on conflict (screen_type_id) do update set name=excluded.name,name_pl=excluded.name_pl,name_en=excluded.name_en,is_active=true;

alter table quickscreen_v2.assessments add column if not exists protocol_data jsonb not null default '{}'::jsonb;

comment on column quickscreen_v2.assessments.protocol_data is 'Versioned descriptive protocol answers, including SFMA Top Tier and optional breakout classifications.';
