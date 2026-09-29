update quickscreen_v2.answer_options
set label_pl = 'Dobry', label_en = 'Good'
where answer_set_id = 'answer_set_pass_fail' and code = 'pass';

update quickscreen_v2.answer_options
set label_pl = 'Zły', label_en = 'Bad'
where answer_set_id = 'answer_set_pass_fail' and code = 'fail';
