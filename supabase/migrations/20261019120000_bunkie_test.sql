insert into quickscreen_v2.screen_types (screen_type_id, code, name, name_pl, name_en, is_active)
values ('screen_bunkie', 'bunkie', 'Bunkie Test', 'Bunkie Test', 'Bunkie Test', true)
on conflict (screen_type_id) do update set name=excluded.name, name_pl=excluded.name_pl, name_en=excluded.name_en, is_active=true;

create table if not exists quickscreen_v2.bunkie_protocol_catalog (
  test_code text primary key,
  name_en text not null,
  name_pl text not null,
  protocol_pl text not null,
  figure_number smallint not null check (figure_number between 1 and 5),
  storage_path text not null,
  image_source text not null,
  image_author text not null,
  image_license text not null,
  active_goal_seconds numeric(6,2) not null check (active_goal_seconds > 0),
  updated_at timestamptz not null default now()
);

create table if not exists quickscreen_v2.bunkie_research_means (
  test_code text not null references quickscreen_v2.bunkie_protocol_catalog(test_code),
  group_code text not null check (group_code in ('women','men','all')),
  left_seconds numeric(6,2) not null,
  right_seconds numeric(6,2) not null,
  citation text not null,
  primary key (test_code, group_code)
);
create table if not exists quickscreen_v2.bunkie_settings (
  setting_key text primary key,
  setting_value text not null,
  updated_at timestamptz not null default now()
);
insert into quickscreen_v2.bunkie_settings(setting_key,setting_value) values ('description','Bunkie Test – ocena wytrzymałości i symetrii funkcjonalnej'||E'\n\n'||'Bunkie Test to zestaw pięciu testów wykonywanych obustronnie, wykorzystywanych do oceny wytrzymałości mięśniowej podczas utrzymywania określonych pozycji ciała.'||E'\n\n'||'Badanie umożliwia ocenę czasu utrzymania prawidłowej pozycji, porównanie lewej i prawej strony oraz identyfikację asymetrii funkcjonalnych.'||E'\n\n'||'Jego istotną zaletą jest możliwość obserwowania zarówno ogólnej wytrzymałości, jak i różnic między stronami ciała.'||E'\n\n'||'Wyniki mogą służyć do monitorowania zmian w kolejnych badaniach i planowania treningu, ale nie stanowią samodzielnej diagnozy.') on conflict(setting_key) do nothing;

alter table quickscreen_v2.assessments add column if not exists protocol_data jsonb not null default '{}'::jsonb;

insert into quickscreen_v2.tests(test_id,code,name,description_short,criteria_summary,source_reference,is_active)
values
('bunkie_apl','bunkie_apl','APL · Przednia linia siłowa','Anterior Power Line','Utrzymanie prawidłowej pozycji; pomiar czasu do zmęczenia lub utraty pozycji.','Brumitt J. (2015), doi:10.1155/2015/780127',true),
('bunkie_lsl','bunkie_lsl','LSL · Boczna linia stabilizacyjna','Lateral Stabilizing Line','Utrzymanie prawidłowej pozycji; pomiar czasu do zmęczenia lub utraty pozycji.','Brumitt J. (2015), doi:10.1155/2015/780127',true),
('bunkie_ppl','bunkie_ppl','PPL · Tylna linia siłowa','Posterior Power Line','Utrzymanie prawidłowej pozycji; pomiar czasu do zmęczenia lub utraty pozycji.','Brumitt J. (2015), doi:10.1155/2015/780127',true),
('bunkie_psl','bunkie_psl','PSL · Tylna linia stabilizacyjna','Posterior Stabilizing Line','Utrzymanie prawidłowej pozycji; pomiar czasu do zmęczenia lub utraty pozycji.','Brumitt J. (2015), doi:10.1155/2015/780127',true),
('bunkie_msl','bunkie_msl','MSL · Przyśrodkowa linia stabilizacyjna','Medial Stabilizing Line','Utrzymanie prawidłowej pozycji; pomiar czasu do zmęczenia lub utraty pozycji.','Brumitt J. (2015), doi:10.1155/2015/780127',true)
on conflict (test_id) do update set name=excluded.name,description_short=excluded.description_short,criteria_summary=excluded.criteria_summary,source_reference=excluded.source_reference,is_active=true;

insert into quickscreen_v2.screen_tests(screen_test_id,screen_type_id,test_id,sort_order,calculation_type,is_active)
select 'bunkie_step_'||t.code,'screen_bunkie',t.test_id,n,'descriptive',true
from (values ('bunkie_apl',1),('bunkie_lsl',2),('bunkie_ppl',3),('bunkie_psl',4),('bunkie_msl',5)) v(code,n)
join quickscreen_v2.tests t on t.code=v.code
on conflict (screen_type_id,test_id) do update set sort_order=excluded.sort_order,is_active=true;

insert into quickscreen_v2.test_fields(test_field_id,screen_test_id,code,label_pl,side_mode,attempt_mode,is_scoring_input,help_text,sort_order,field_type,measurement_unit,measurement_min,measurement_max,measurement_step,is_required)
select 'bunkie_time_'||t.code,s.screen_test_id,'bunkie_time_'||t.code,'Czas utrzymania (s)','bilateral','single',false,'Czas w sekundach. Nie zatrzymuj automatycznie po osiągnięciu celu.',1,'measurement','s',0,3600,0.01,false
from quickscreen_v2.screen_tests s join quickscreen_v2.tests t on t.test_id=s.test_id where s.screen_type_id='screen_bunkie'
on conflict (test_field_id) do update set code=excluded.code,label_pl=excluded.label_pl,help_text=excluded.help_text,measurement_unit='s',measurement_min=0,measurement_max=3600,is_required=false;

insert into quickscreen_v2.test_descriptions(test_id,locale,manual_version,procedure,side_definition,scoring_criteria,source_reference,content_hash,is_active)
select t.test_id,'pl','BUNKIE-BRUMITT-2015-APP-1',c.protocol_pl,'Strona testu jest określana przez nogę pozostającą na podwyższeniu.',t.criteria_summary,'Brumitt J. (2015), The Bunkie Test: Descriptive Data for a Novel Test of Core Muscular Endurance. https://doi.org/10.1155/2015/780127',md5(c.protocol_pl||t.criteria_summary),true
from quickscreen_v2.tests t join quickscreen_v2.bunkie_protocol_catalog c on c.test_code=t.code
on conflict (test_id,locale,manual_version) do update set procedure=excluded.procedure,side_definition=excluded.side_definition,scoring_criteria=excluded.scoring_criteria,source_reference=excluded.source_reference,content_hash=excluded.content_hash,is_active=true;

insert into quickscreen_v2.bunkie_protocol_catalog(test_code,name_en,name_pl,protocol_pl,figure_number,storage_path,image_source,image_author,image_license,active_goal_seconds)
values
('bunkie_apl','Anterior Power Line','Przednia linia siłowa','Pozycja początkowa: ułóż ciało przodem do podłoża, oprzyj kończyny górne o matę, a kończynę podporową w okolicy środkowej części ścięgna Achillesa na podwyższeniu o wysokości 30 cm. Ustaw tułów i kończyny zgodnie z Figure 1; przed próbą trener może udzielić wskazówek głosowych. Stronę określa noga pozostająca na podwyższeniu. Pomiar rozpocznij po oderwaniu drugiej nogi od podwyższenia. Utrzymuj pozycję przedstawioną na ilustracji. Zakończ przy zmęczeniu badanego lub niemożności utrzymania pozycji. Dopuszczalna jest jedna próba skorygowania pozycji po wskazówce głosowej; gdy prawidłowa pozycja nie zostanie odzyskana, zakończ pomiar. Przy bólu zakończ próbę i zapisz powód. Badanie Brumitta stosowało 30 s odpoczynku; aplikacja zaleca minimum 60 s.','1','bunkie/figure-1','https://doi.org/10.1155/2015/780127','Jason Brumitt','CC BY 3.0 (2015 article; attribution required)',40),
('bunkie_lsl','Lateral Stabilizing Line','Boczna linia stabilizacyjna','Pozycja początkowa: ułóż się bokiem, oprzyj kończynę górną o matę, a kończynę podporową w okolicy środkowej części ścięgna Achillesa na podwyższeniu o wysokości 30 cm. Ustaw tułów i kończyny zgodnie z Figure 2; przed próbą trener może udzielić wskazówek głosowych. Stronę określa noga pozostająca na podwyższeniu. Pomiar rozpocznij po oderwaniu drugiej nogi od podwyższenia. Utrzymuj pozycję przedstawioną na ilustracji. Zakończ przy zmęczeniu badanego lub niemożności utrzymania pozycji. Dopuszczalna jest jedna próba skorygowania pozycji po wskazówce głosowej; gdy prawidłowa pozycja nie zostanie odzyskana, zakończ pomiar. Przy bólu zakończ próbę i zapisz powód. Badanie Brumitta stosowało 30 s odpoczynku; aplikacja zaleca minimum 60 s.','2','bunkie/figure-2','https://doi.org/10.1155/2015/780127','Jason Brumitt','CC BY 3.0 (2015 article; attribution required)',40),
('bunkie_ppl','Posterior Power Line','Tylna linia siłowa','Pozycja początkowa: ułóż się tyłem/bokiem zgodnie z Figure 3, oprzyj kończyny górne o matę, a kończynę podporową w okolicy środkowej części ścięgna Achillesa na podwyższeniu o wysokości 30 cm. Przed próbą trener może udzielić wskazówek głosowych. Stronę określa noga pozostająca na podwyższeniu. Pomiar rozpocznij po oderwaniu drugiej nogi od podwyższenia. Utrzymuj pozycję przedstawioną na ilustracji. Zakończ przy zmęczeniu badanego lub niemożności utrzymania pozycji. Dopuszczalna jest jedna próba skorygowania pozycji po wskazówce głosowej; gdy prawidłowa pozycja nie zostanie odzyskana, zakończ pomiar. Przy bólu zakończ próbę i zapisz powód. Badanie Brumitta stosowało 30 s odpoczynku; aplikacja zaleca minimum 60 s.','3','bunkie/figure-3','https://doi.org/10.1155/2015/780127','Jason Brumitt','CC BY 3.0 (2015 article; attribution required)',40),
('bunkie_psl','Posterior Stabilizing Line','Tylna linia stabilizacyjna','Pozycja początkowa: ułóż się bokiem zgodnie z Figure 4, oprzyj kończynę górną o matę, a kończynę podporową w okolicy środkowej części ścięgna Achillesa na podwyższeniu o wysokości 30 cm. Przed próbą trener może udzielić wskazówek głosowych. Stronę określa noga pozostająca na podwyższeniu. Pomiar rozpocznij po oderwaniu drugiej nogi od podwyższenia. Utrzymuj pozycję przedstawioną na ilustracji. Zakończ przy zmęczeniu badanego lub niemożności utrzymania pozycji. Dopuszczalna jest jedna próba skorygowania pozycji po wskazówce głosowej; gdy prawidłowa pozycja nie zostanie odzyskana, zakończ pomiar. Przy bólu zakończ próbę i zapisz powód. Badanie Brumitta stosowało 30 s odpoczynku; aplikacja zaleca minimum 60 s.','4','bunkie/figure-4','https://doi.org/10.1155/2015/780127','Jason Brumitt','CC BY 3.0 (2015 article; attribution required)',40),
('bunkie_msl','Medial Stabilizing Line','Przyśrodkowa linia stabilizacyjna','Pozycja początkowa: ułóż się bokiem zgodnie z Figure 5, oprzyj kończynę górną o matę, a kończynę podporową w okolicy środkowej części ścięgna Achillesa na podwyższeniu o wysokości 30 cm. Przed próbą trener może udzielić wskazówek głosowych. Stronę określa noga pozostająca na podwyższeniu. Pomiar rozpocznij po oderwaniu drugiej nogi od podwyższenia. Utrzymuj pozycję przedstawioną na ilustracji. Zakończ przy zmęczeniu badanego lub niemożności utrzymania pozycji. Dopuszczalna jest jedna próba skorygowania pozycji po wskazówce głosowej; gdy prawidłowa pozycja nie zostanie odzyskana, zakończ pomiar. Przy bólu zakończ próbę i zapisz powód. Badanie Brumitta stosowało 30 s odpoczynku; aplikacja zaleca minimum 60 s.','5','bunkie/figure-5','https://doi.org/10.1155/2015/780127','Jason Brumitt','CC BY 3.0 (2015 article; attribution required)',25)
on conflict(test_code) do update set name_en=excluded.name_en,name_pl=excluded.name_pl,protocol_pl=excluded.protocol_pl,figure_number=excluded.figure_number,storage_path=excluded.storage_path,image_source=excluded.image_source,image_author=excluded.image_author,image_license=excluded.image_license,active_goal_seconds=excluded.active_goal_seconds,updated_at=now();

insert into quickscreen_v2.bunkie_research_means(test_code,group_code,left_seconds,right_seconds,citation) values
('bunkie_apl','women',37.9,36.9,'Brumitt (2015), Table 2'),('bunkie_apl','men',45.5,42.9,'Brumitt (2015), Table 2'),('bunkie_apl','all',40.0,38.6,'Brumitt (2015), Table 2'),
('bunkie_lsl','women',39.9,41.9,'Brumitt (2015), Table 2'),('bunkie_lsl','men',38.6,42.1,'Brumitt (2015), Table 2'),('bunkie_lsl','all',39.5,42.0,'Brumitt (2015), Table 2'),
('bunkie_ppl','women',50.3,46.9,'Brumitt (2015), Table 2'),('bunkie_ppl','men',46.5,46.3,'Brumitt (2015), Table 2'),('bunkie_ppl','all',49.2,46.7,'Brumitt (2015), Table 2'),
('bunkie_psl','women',39.0,38.7,'Brumitt (2015), Table 2'),('bunkie_psl','men',36.7,38.1,'Brumitt (2015), Table 2'),('bunkie_psl','all',38.4,38.6,'Brumitt (2015), Table 2'),
('bunkie_msl','women',20.3,21.3,'Brumitt (2015), Table 2'),('bunkie_msl','men',27.0,29.8,'Brumitt (2015), Table 2'),('bunkie_msl','all',22.2,23.6,'Brumitt (2015), Table 2')
on conflict(test_code,group_code) do update set left_seconds=excluded.left_seconds,right_seconds=excluded.right_seconds,citation=excluded.citation;

update quickscreen_v2.bunkie_protocol_catalog c set protocol_pl =
  'Pozycja początkowa i ustawienie kończyn/tułowia: przyjmij pozycję przedstawioną na oryginalnej Figure '||c.figure_number||' (obraz referencyjny poniżej). Artykuł opisuje pozycje przez ilustracje i nie podaje szczegółowej listy kątów stawowych ani dodatkowych korekt dla tej pozycji. Ustaw kończynę podporową w okolicy środkowej części ścięgna Achillesa na podwyższeniu; oprzyj kończyny górne o matę na podłodze. Różnica wysokości maty i podwyższenia wynosi 30 cm. Przed próbą trener może udzielić werbalnych wskazówek potrzebnych do uzyskania pozycji pokazanej na ilustracji. Stronę określa noga, która pozostaje na podwyższeniu. Rozpocznij pomiar w chwili oderwania drugiej nogi od podwyższenia. Utrzymuj pozycję widoczną na ilustracji; mierz czas w sekundach. Zakończ próbę, gdy badany przerwie z powodu zmęczenia albo nie będzie w stanie utrzymać prawidłowej pozycji. Dopuszczalna jest jedna próba korekty po wskazówce głosowej; jeśli badany nie odzyska pozycji, zakończ pomiar. Przy bólu zakończ próbę i zapisz jego wystąpienie oraz przyczynę w notatce trenera. Badanie Brumitta stosowało 30 sekund odpoczynku; aplikacja przyjmuje zalecane minimum 60 sekund, bez wymuszania kolejnej próby.';
update quickscreen_v2.test_descriptions d set procedure=c.protocol_pl,side_definition='Stronę określa kończyna dolna pozostająca na podwyższeniu.',source_reference='Brumitt J. (2015), The Bunkie Test: Descriptive Data for a Novel Test of Core Muscular Endurance. https://doi.org/10.1155/2015/780127',content_hash=md5(c.protocol_pl)
from quickscreen_v2.bunkie_protocol_catalog c join quickscreen_v2.tests t on t.code=c.test_code
where d.test_id=t.test_id and d.locale='pl' and d.manual_version='BUNKIE-BRUMITT-2015-APP-1';

create or replace function quickscreen_v2.submit_assessment_bunkie(p_assessment_id uuid,p_client_id uuid,p_screen_type_id text,p_assessment_date date,p_manual_version text,p_notes jsonb,p_field_measurements jsonb,p_protocol_data jsonb)
returns jsonb language plpgsql security definer set search_path=quickscreen_v2,public as $$
declare v_result jsonb;
begin
  if p_screen_type_id <> 'screen_bunkie' then raise exception 'invalid_bunkie_protocol'; end if;
  v_result:=quickscreen_v2.submit_assessment_v3(p_assessment_id,p_client_id,p_screen_type_id,p_assessment_date,p_manual_version,'[]'::jsonb,p_notes,p_field_measurements);
  if coalesce((v_result->>'alreadyCompleted')::boolean,false) then return v_result; end if;
  update quickscreen_v2.assessments set protocol_data=p_protocol_data,total_score=null,max_score=null where assessment_id=p_assessment_id and owner_id=auth.uid() and status='completed';
  if not found then raise exception 'assessment_write_failed'; end if;
  return v_result||jsonb_build_object('totalScore',null,'maximum',null);
end; $$;
create or replace function quickscreen_v2.edit_assessment_bunkie(p_assessment_id uuid,p_assessment_date date,p_correction_note text,p_notes jsonb,p_field_measurements jsonb,p_protocol_data jsonb)
returns jsonb language plpgsql security definer set search_path=quickscreen_v2,public as $$
declare v_result jsonb;
begin
  v_result:=quickscreen_v2.edit_assessment_v3(p_assessment_id,p_assessment_date,p_correction_note,'[]'::jsonb,p_notes,p_field_measurements);
  update quickscreen_v2.assessments set protocol_data=p_protocol_data,total_score=null,max_score=null where assessment_id=p_assessment_id and owner_id=auth.uid() and status='completed';
  if not found then raise exception 'assessment_write_failed'; end if;
  return v_result||jsonb_build_object('totalScore',null,'maximum',null);
end; $$;
revoke all on function quickscreen_v2.submit_assessment_bunkie(uuid,uuid,text,date,text,jsonb,jsonb,jsonb) from public,anon;
revoke all on function quickscreen_v2.edit_assessment_bunkie(uuid,date,text,jsonb,jsonb,jsonb) from public,anon;
grant execute on function quickscreen_v2.submit_assessment_bunkie(uuid,uuid,text,date,text,jsonb,jsonb,jsonb) to authenticated;
grant execute on function quickscreen_v2.edit_assessment_bunkie(uuid,date,text,jsonb,jsonb,jsonb) to authenticated;

alter table quickscreen_v2.bunkie_protocol_catalog enable row level security;
alter table quickscreen_v2.bunkie_research_means enable row level security;
alter table quickscreen_v2.bunkie_settings enable row level security;
create policy bunkie_catalog_read on quickscreen_v2.bunkie_protocol_catalog for select to authenticated using (true);
create policy bunkie_means_read on quickscreen_v2.bunkie_research_means for select to authenticated using (true);
create policy bunkie_settings_read on quickscreen_v2.bunkie_settings for select to authenticated using (true);
create policy bunkie_catalog_admin_write on quickscreen_v2.bunkie_protocol_catalog for all to authenticated using (exists(select 1 from quickscreen_v2.profiles p where p.id=auth.uid() and p.role='admin')) with check (exists(select 1 from quickscreen_v2.profiles p where p.id=auth.uid() and p.role='admin'));
create policy bunkie_means_admin_write on quickscreen_v2.bunkie_research_means for all to authenticated using (exists(select 1 from quickscreen_v2.profiles p where p.id=auth.uid() and p.role='admin')) with check (exists(select 1 from quickscreen_v2.profiles p where p.id=auth.uid() and p.role='admin'));
create policy bunkie_settings_admin_write on quickscreen_v2.bunkie_settings for all to authenticated using (exists(select 1 from quickscreen_v2.profiles p where p.id=auth.uid() and p.role='admin')) with check (exists(select 1 from quickscreen_v2.profiles p where p.id=auth.uid() and p.role='admin'));
create policy bunkie_descriptions_admin_write on quickscreen_v2.test_descriptions for all to authenticated using (exists(select 1 from quickscreen_v2.profiles p where p.id=auth.uid() and p.role='admin')) with check (exists(select 1 from quickscreen_v2.profiles p where p.id=auth.uid() and p.role='admin'));
grant select on quickscreen_v2.bunkie_protocol_catalog,quickscreen_v2.bunkie_research_means,quickscreen_v2.bunkie_settings to authenticated;
grant insert,update,delete on quickscreen_v2.bunkie_protocol_catalog,quickscreen_v2.bunkie_research_means,quickscreen_v2.bunkie_settings,quickscreen_v2.test_descriptions to authenticated;

create policy bunkie_images_public_read on storage.objects for select to public using (bucket_id='bunkie-reference');
create policy bunkie_images_admin_write on storage.objects for all to authenticated using (bucket_id='bunkie-reference' and exists(select 1 from quickscreen_v2.profiles p where p.id=auth.uid() and p.role='admin')) with check (bucket_id='bunkie-reference' and exists(select 1 from quickscreen_v2.profiles p where p.id=auth.uid() and p.role='admin'));

insert into storage.buckets(id,name,public) values ('bunkie-reference','bunkie-reference',true) on conflict(id) do update set public=true;
