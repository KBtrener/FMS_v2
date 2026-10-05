create table if not exists quickscreen_v2.client_anthropometry (
  anthropometry_id uuid primary key default gen_random_uuid(),
  client_id uuid not null references quickscreen_v2.clients(client_id) on delete cascade,
  owner_id uuid not null references quickscreen_v2.profiles(id) on delete cascade,
  measurement_code text not null check (measurement_code in ('hand_length','tibia_length','foot_length')),
  value numeric(10,3) not null check (value > 0 and value <= 100),
  unit text not null check (unit in ('cm','in')),
  measured_at date not null,
  source_assessment_id uuid references quickscreen_v2.assessments(assessment_id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists client_anthropometry_latest_idx
  on quickscreen_v2.client_anthropometry(client_id, measurement_code, measured_at desc, created_at desc);
alter table quickscreen_v2.client_anthropometry enable row level security;
create policy client_anthropometry_owner on quickscreen_v2.client_anthropometry for all to authenticated
  using (owner_id = auth.uid() and exists (select 1 from quickscreen_v2.clients c where c.client_id = client_anthropometry.client_id and c.owner_id = auth.uid()))
  with check (owner_id = auth.uid() and exists (select 1 from quickscreen_v2.clients c where c.client_id = client_anthropometry.client_id and c.owner_id = auth.uid()));
grant select, insert on quickscreen_v2.client_anthropometry to authenticated;

-- Import historical measurement snapshots without changing assessment rows.
insert into quickscreen_v2.client_anthropometry(client_id,owner_id,measurement_code,value,unit,measured_at,source_assessment_id)
select a.client_id,a.owner_id,'hand_length',m.value_cm,'cm',a.assessment_date,a.assessment_id
from quickscreen_v2.assessment_measurements m join quickscreen_v2.assessments a using(assessment_id)
where m.measurement_code='shoulder_hand_length' and m.side='none'
on conflict do nothing;

insert into quickscreen_v2.client_anthropometry(client_id,owner_id,measurement_code,value,unit,measured_at,source_assessment_id)
select a.client_id,a.owner_id,'hand_length',m.numeric_value,m.unit,a.assessment_date,a.assessment_id
from quickscreen_v2.assessment_field_measurements m
join quickscreen_v2.assessments a using(assessment_id)
where m.test_field_id='field_fms_shoulder_mobility_hand_length'
  and not exists (
    select 1 from quickscreen_v2.client_anthropometry existing
    where existing.client_id=a.client_id and existing.measurement_code='hand_length'
      and existing.measured_at=a.assessment_date
  )
on conflict do nothing;

insert into quickscreen_v2.client_anthropometry(client_id,owner_id,measurement_code,value,unit,measured_at,source_assessment_id)
select distinct on (a.client_id,a.assessment_date, mapping.measurement_code)
 a.client_id,a.owner_id,mapping.measurement_code,m.numeric_value,m.unit,a.assessment_date,a.assessment_id
from quickscreen_v2.assessment_field_measurements m
join quickscreen_v2.assessments a using(assessment_id)
join (values
 ('field_fms_hurdle_step_tibia_length','tibia_length'),
 ('field_fms_lower_body_mcs_foot_length','foot_length'),
 ('field_fms_upper_body_mcs_foot_length','foot_length')
) mapping(test_field_id,measurement_code) using(test_field_id)
order by a.client_id,a.assessment_date,mapping.measurement_code,a.created_at,m.created_at
on conflict do nothing;
