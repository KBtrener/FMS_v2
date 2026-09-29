-- Copy the existing V1 records into the isolated V2 schema once.
-- Use only columns present in both schemas so V2-only metadata keeps defaults.
-- The owner check is designed for interactive requests; the migration copies
-- records owned by all historical users before enabling the normal RLS flow.
alter table quickscreen_v2.assessments disable trigger assessments_validate_owner;

do $$
declare
  v_table_name text;
  common_columns text;
  common_select text;
  tables text[] := array[
    'profiles', 'screen_types', 'tests', 'screen_tests', 'answer_sets',
    'answer_options', 'test_fields', 'effect_rules', 'clients',
    'assessments', 'assessment_answers', 'applied_effects',
    'test_descriptions', 'trainer_certifications', 'client_disciplines',
    'trainer_client_access', 'assessment_test_notes', 'report_profiles',
    'client_services', 'trainer_recommendations', 'report_instances',
    'report_instance_sections'
  ];
begin
  foreach v_table_name in array tables loop
    if to_regclass(format('public.%I', v_table_name)) is null
      or to_regclass(format('quickscreen_v2.%I', v_table_name)) is null then
      continue;
    end if;

    select string_agg(format('%I', target.column_name), ', ' order by target.ordinal_position)
      into common_columns
      from information_schema.columns target
      join information_schema.columns source
        on source.table_schema = 'public'
       and source.table_name = v_table_name
       and source.column_name = target.column_name
     where target.table_schema = 'quickscreen_v2'
       and target.table_name = v_table_name;

    if common_columns is not null then
      select string_agg(
        case when target.data_type = 'USER-DEFINED' and target.udt_schema = 'quickscreen_v2'
          then format('source.%I::text::quickscreen_v2.%I', target.column_name, target.udt_name)
          else format('source.%I', target.column_name) end,
        ', ' order by target.ordinal_position
      ) into common_select
      from information_schema.columns target
      join information_schema.columns source
        on source.table_schema = 'public'
       and source.table_name = v_table_name
       and source.column_name = target.column_name
      where target.table_schema = 'quickscreen_v2'
        and target.table_name = v_table_name;

      execute format(
        'insert into quickscreen_v2.%I (%s) select %s from public.%I source on conflict do nothing',
        v_table_name, common_columns, common_select, v_table_name
      );
    end if;
  end loop;
end;
$$;

alter table quickscreen_v2.assessments enable trigger assessments_validate_owner;
