-- Migrate: add training exercises reference data and progression metadata

create table if not exists public.training_exercises (
  id text primary key,
  machine_name text not null,
  category text not null,
  primary_muscles text[] not null default array[]::text[],
  secondary_muscles text[] not null default array[]::text[],
  movement_pattern text,
  target_sets_min smallint,
  target_sets_max smallint,
  target_reps_min smallint,
  target_reps_max smallint,
  target_rir_min smallint,
  target_rir_max smallint,
  rest_seconds_min smallint,
  rest_seconds_max smallint,
  setup_steps jsonb,
  execution_cues jsonb,
  breathing_cues text,
  common_mistakes jsonb,
  progression_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_training_exercises_updated on public.training_exercises;
create trigger trg_training_exercises_updated
before update on public.training_exercises
for each row
execute procedure public.set_updated_at();

alter table public.training_exercises enable row level security;

drop policy if exists "Public read training_exercises" on public.training_exercises;
create policy "Public read training_exercises" on public.training_exercises
  for select
  using (true);

insert into public.training_exercises (
  id,
  machine_name,
  category,
  primary_muscles,
  secondary_muscles,
  movement_pattern,
  target_sets_min,
  target_sets_max,
  target_reps_min,
  target_reps_max,
  target_rir_min,
  target_rir_max,
  rest_seconds_min,
  rest_seconds_max,
  setup_steps,
  execution_cues,
  breathing_cues,
  common_mistakes,
  progression_notes
) values
  (
    'machine-chest-press',
    'チェストプレスマシン',
    'upper-push',
    array['大胸筋','三角筋前部','上腕三頭筋'],
    array['前鋸筋'],
    'horizontal-press',
    3, 3, 8, 12, 1, 2, 120, 180,
    jsonb_build_array(
      'シートの高さを調整しグリップが胸の中央に並ぶようにする',
      '肩甲骨を引き下げて寄せ、背中をパッドに密着させる',
      '足裏全体を床に着け腹圧を軽くかける'
    ),
    jsonb_build_array(
      '息を吐きながら大胸筋の収縮を意識して押し出す',
      'トップで肘をロックせずテンションを維持する',
      '息を吸いながら2〜3秒かけてコントロールして戻す'
    ),
    '押す局面で息を吐き、戻す局面で息を吸う。',
    jsonb_build_array(
      '肩が前に出て猫背になる',
      '身体の反動を使って押し出す',
      '手首が折れてバーが掌の中心に乗っていない'
    ),
    'RIR 1-2 を維持しながら 12 レップを揃えたら最小単位で重量を増やし 8 レップから再開するダブルプログレッションを適用する。'
  ),
  (
    'machine-shoulder-press',
    'ショルダープレスマシン',
    'upper-push',
    array['三角筋前部','三角筋中部','上腕三頭筋'],
    array['僧帽筋下部'],
    'vertical-press',
    3, 3, 8, 12, 1, 2, 120, 180,
    jsonb_build_array(
      'シートに深く座り背中をパッドに密着させる',
      'グリップが肩〜耳の高さに来るようシートを調整する',
      '足裏を床に固定し腹圧で体幹を安定させる'
    ),
    jsonb_build_array(
      '息を吐きながらバーを真上へ押し上げる',
      '肩をすくめず肘を手首の真下に保つ',
      '戻しは3秒程度かけ可動域をコントロールする'
    ),
    '押し上げで吐き、コントロールしながら戻す際に吸う。',
    jsonb_build_array(
      '腰を反らせて反動で押し上げる',
      '肩がすくんで僧帽筋に負荷が逃げる',
      '可動域が浅く肘が前方へ流れる'
    ),
    'RIR 1-2 を守りつつ 12 レップを安定させたら重量を 2.5kg 程度増やし 8 レップから積み上げる。'
  ),
  (
    'pec-deck',
    'ペックデックフライ',
    'upper-isolation',
    array['大胸筋'],
    array['上腕二頭筋'],
    'horizontal-adduction',
    3, 3, 10, 15, 1, 2, 90, 120,
    jsonb_build_array(
      'パッドが胸の高さになるようにシートを調整する',
      '肘を軽く曲げた位置で固定し背中をパッドに密着させる',
      '肩甲骨を軽く寄せ胸を張った姿勢を作る'
    ),
    jsonb_build_array(
      '息を吐きながら胸の中心で腕を閉じ大胸筋を絞り込む',
      'トップで1秒静止し内側の収縮を感じる',
      '戻しは胸のストレッチを感じながらゆっくり行う'
    ),
    '閉じる局面で吐き、戻す局面で吸う。',
    jsonb_build_array(
      '肘の角度が動き肩関節に負担がかかる',
      '肩がすくんで僧帽筋に力が逃げる',
      '反動を使ってウエイトを振り回す'
    ),
    'RIR 1-2 の範囲で 15 レップに到達したら重量を増やし 10 レップから再度積み上げる。'
  ),
  (
    'machine-triceps-press',
    'トライセプスプレス',
    'upper-isolation',
    array['上腕三頭筋'],
    array['三角筋後部'],
    'elbow-extension',
    3, 3, 10, 15, 1, 2, 90, 120,
    jsonb_build_array(
      '肘を体側に固定できる位置にシートやパッドを調整する',
      '胸を張り肩を下げてグリップを握る',
      '手首をまっすぐ保ち前腕のラインを整える'
    ),
    jsonb_build_array(
      '息を吐きながら肘を伸ばし下方向に押し切る',
      'トップで上腕三頭筋を収縮させ1秒静止',
      '戻しは肘を固定したままコントロールする'
    ),
    '押し下げで吐き、戻しながら吸う。',
    jsonb_build_array(
      '肘が前後に動いてしまう',
      '体幹が揺れて動作に反動が混じる',
      '手首が折れて負荷が逃げる'
    ),
    '全セット 15 レップを RIR 1-2 でこなせたら重量を最小単位で増やし 10 レップに戻す。'
  ),
  (
    'machine-lateral-raise',
    'マシンラテラルレイズ',
    'upper-isolation',
    array['三角筋中部'],
    array['三角筋後部'],
    'shoulder-abduction',
    3, 3, 12, 15, 1, 2, 90, 120,
    jsonb_build_array(
      '肩関節がマシンの回転軸と一致するようシートを調整する',
      '体幹を安定させ肩を下げた状態でパッドに腕を乗せる',
      '肘は軽く曲げ固定する'
    ),
    jsonb_build_array(
      '息を吐きながら肘を先導させて真横に持ち上げる',
      '僧帽筋に力が入らないよう肩をすくめない',
      '戻しはテンションを保ったままコントロールする'
    ),
    '持ち上げで吐き、戻しで吸う。',
    jsonb_build_array(
      '重すぎる重量で反動を使う',
      '肩がすくみ僧帽筋中心の動作になる',
      'トップで肘が前方へ流れる'
    ),
    'RIR 1-2 をキープしながら 15 レップに達したら重量を増やし 12 レップに戻す。'
  ),
  (
    'machine-leg-press-standard',
    'レッグプレス（標準スタンス）',
    'lower-compound',
    array['大腿四頭筋','大臀筋','ハムストリングス'],
    array['内転筋群'],
    'knee-dominant-press',
    4, 4, 8, 12, 1, 2, 120, 180,
    jsonb_build_array(
      'シートに深く座り腰と背中をパッドに密着させる',
      '足幅を肩幅程度にしプレート中央へ置く',
      '膝が90度になるようシート位置を調整する'
    ),
    jsonb_build_array(
      '息を吸いながらゆっくりプレートを胸へ引き寄せる',
      '踵で押し出すイメージで脚を伸ばす',
      '膝をロックせずテンションを残したまま戻す'
    ),
    '下降で吸い、押し出す局面で強く吐く。',
    jsonb_build_array(
      '膝が内側に入るニーイン',
      '可動域が浅く曲げが不足する',
      '腰が浮いて腰椎に負担がかかる'
    ),
    'RIR 1-2 を守り全セット 12 レップに到達したら重量を 5kg 目安で増やし 8 レップから再開する。'
  ),
  (
    'machine-leg-extension',
    'レッグエクステンション',
    'lower-isolation',
    array['大腿四頭筋'],
    array['前脛骨筋'],
    'knee-extension',
    3, 3, 12, 15, 1, 2, 90, 120,
    jsonb_build_array(
      '膝の軸とマシンの回転軸を揃える',
      '足首パッドを足首前面に合わせ太ももを固定する',
      '背もたれに密着しハンドルを握って姿勢を安定させる'
    ),
    jsonb_build_array(
      '息を吐きながら膝を伸ばしきり四頭筋を収縮させる',
      'トップで1秒静止して収縮を意識する',
      '戻しはコントロールしテンションを抜かない'
    ),
    '伸ばす局面で吐き、戻す局面で吸う。',
    jsonb_build_array(
      '反動で蹴り上げる',
      '腰やお尻が浮く',
      'つま先が上下に動いてしまう'
    ),
    '15 レップを安定して達成したら重量を増やし 12 レップから積み上げる。'
  ),
  (
    'machine-abductor',
    'アブダクターマシン',
    'lower-isolation',
    array['中臀筋','小臀筋'],
    array['大臀筋上部'],
    'hip-abduction',
    3, 3, 12, 15, 1, 2, 90, 120,
    jsonb_build_array(
      '背もたれに背中を密着させ膝外側にパッドを当てる',
      '可動域ピンを無理のない範囲に設定する',
      '骨盤を立てて体幹を安定させる'
    ),
    jsonb_build_array(
      '息を吐きながらお尻の外側で脚を外転させる',
      'トップで1秒静止し中臀筋の収縮を感じる',
      '戻しは反動を使わずコントロールする'
    ),
    '外へ開く局面で吐き、戻しで吸う。',
    jsonb_build_array(
      '反動で勢いよく開閉する',
      'つま先が上や外に向き負荷が逃げる',
      '可動域が狭く筋肉が十分に伸びない'
    ),
    '全セット 15 レップを RIR 1-2 で達成したら重量を増やし 12 レップから再スタートする。'
  ),
  (
    'machine-abdominal-crunch',
    'マシンアブドミナルクランチ',
    'core',
    array['腹直筋'],
    array['腹斜筋'],
    'trunk-flexion',
    3, 3, 15, 20, 0, 1, 60, 90,
    jsonb_build_array(
      '胸のパッドが鎖骨付近に来るようシートを調整する',
      '背中と腰をパッドに密着させ骨盤を安定させる',
      'ハンドルを軽く握り腹圧を高める'
    ),
    jsonb_build_array(
      '息を吐きながら背骨を丸めてへそを覗き込む',
      'ボトムで1秒静止し腹直筋の収縮を最大化する',
      '戻しは腰を反らせず腹筋で制御する'
    ),
    '体幹を丸める局面で吐き、戻しで吸う。',
    jsonb_build_array(
      '股関節から曲げてしまい腸腰筋が主導する',
      '腕の力でハンドルを引き動作する',
      '戻しで腰を反らせる'
    ),
    'RIR 0-1 を守り 20 レップが余裕になったら負荷をわずかに追加し 15 レップから再開する。'
  ),
  (
    'machine-lat-pulldown',
    'ラットプルダウン',
    'upper-pull',
    array['広背筋','大円筋'],
    array['上腕二頭筋','僧帽筋中部'],
    'vertical-pull',
    3, 3, 8, 12, 1, 2, 120, 180,
    jsonb_build_array(
      '膝パッドで太ももを固定し背筋を伸ばす',
      '胸を張り肩甲骨を軽く下制した姿勢を作る',
      '手幅は肩幅よりやや広くバーを握る'
    ),
    jsonb_build_array(
      '息を吐きながら肘を体側へ引きバーを鎖骨に近づける',
      '背中の収縮を感じながら1秒静止',
      '戻しは広背筋のストレッチを意識してコントロールする'
    ),
    '引く局面で吐き、戻す局面で吸う。',
    jsonb_build_array(
      '腕だけで引いて背中を使えていない',
      '身体を反らしすぎて反動を使う',
      '背中が丸まり肩が前に出る'
    ),
    '全セット 12 レップを RIR 1-2 で達成したら重量を増やし 8 レップから段階的に伸ばす。'
  ),
  (
    'machine-seated-row',
    'シーテッドローマシン',
    'upper-pull',
    array['広背筋','僧帽筋中部','菱形筋'],
    array['上腕二頭筋'],
    'horizontal-row',
    3, 3, 8, 12, 1, 2, 120, 180,
    jsonb_build_array(
      '胸パッドに胸を軽く当て背筋を伸ばす',
      'ハンドルを握り肩甲骨を軽く寄せた姿勢を作る',
      '足をフットプレートに置き膝を軽く曲げる'
    ),
    jsonb_build_array(
      '息を吐きながら肘を後方へ引き肩甲骨を中央に寄せる',
      'トップで1秒静止し背中の収縮を感じる',
      '戻しは肩をすくめずコントロールする'
    ),
    '引く局面で吐き、戻す局面で吸う。',
    jsonb_build_array(
      '体幹を前後に揺らし反動で引く',
      '肘が外に開き肩がすくむ',
      '背中が丸まり可動域が狭い'
    ),
    '12 レップに到達後は重量を最小単位で増やし 8 レップから再挑戦する。'
  ),
  (
    'machine-rear-delt',
    'リアデルトフライ',
    'upper-isolation',
    array['三角筋後部'],
    array['僧帽筋中部'],
    'horizontal-abduction',
    3, 3, 12, 15, 1, 2, 90, 120,
    jsonb_build_array(
      'マシンに向かって座り胸をパッドに固定する',
      '肩甲骨を軽く開き肘をわずかに曲げる',
      '首を長く保ち肩をすくめない'
    ),
    jsonb_build_array(
      '息を吐きながら肘を外に引き肩後部で動作する',
      '肩甲骨を寄せすぎず三角筋後部の緊張を維持する',
      '戻しはテンションを保ったままコントロールする'
    ),
    '開く局面で吐き、戻す局面で吸う。',
    jsonb_build_array(
      '僧帽筋で引いてしまう',
      '反動で上体が動いてしまう',
      'トップでテンションが抜ける'
    ),
    '15 レップを RIR 1-2 で揃えたら重量を増やし 12 レップから再開する。'
  ),
  (
    'machine-biceps-press',
    'バイセプスプレス',
    'upper-isolation',
    array['上腕二頭筋','上腕筋'],
    array['腕橈骨筋'],
    'elbow-flexion',
    3, 3, 10, 15, 1, 2, 90, 120,
    jsonb_build_array(
      '肘がマシンの回転軸に一致するようシートを調整する',
      '上腕をパッドに固定し手首を真っ直ぐ保つ',
      '胸を張り肩を下げて構える'
    ),
    jsonb_build_array(
      '息を吐きながら肘を曲げ重量を引き上げる',
      'トップで力こぶを強く意識し1秒静止',
      '戻しは肘を固定したままゆっくりコントロールする'
    ),
    '引き上げで吐き、戻しで吸う。',
    jsonb_build_array(
      '肘が前に動いて肩が主導する',
      '体を揺すって反動を使う',
      '手首が反って負荷が逃げる'
    ),
    '15 レップを達成したら重量を増やし 10 レップから積み上げる。'
  ),
  (
    'machine-rotary-torso',
    'ロータリートルソー',
    'core',
    array['腹斜筋'],
    array['腹横筋'],
    'trunk-rotation',
    3, 3, 12, 15, 1, 2, 60, 90,
    jsonb_build_array(
      'シートに座り下半身をパッドで固定する',
      '胸パッドを抱え背筋を伸ばす',
      '回旋角度を痛みのない範囲で設定する'
    ),
    jsonb_build_array(
      '息を吐きながらみぞおちから体幹を捻る',
      '腰ではなく胸椎から回旋する感覚を持つ',
      '戻しは勢いを使わずコントロールする'
    ),
    '回旋で吐き、戻しで吸う。',
    jsonb_build_array(
      '腰から無理に捻ってしまう',
      '反動を使って勢いで回す',
      '肩がすくんで体幹から力が抜ける'
    ),
    '左右とも 15 レップを RIR 1-2 でこなせたら重量を増やし 12 レップへ戻して再構築する。'
  ),
  (
    'machine-leg-press-high',
    'レッグプレス（ハイスタンス）',
    'lower-compound',
    array['大臀筋','ハムストリングス'],
    array['大腿四頭筋'],
    'hip-dominant-press',
    4, 4, 10, 15, 1, 2, 120, 180,
    jsonb_build_array(
      '足をプレート上部に置き股関節の可動域を確保する',
      '腰と背中を常にパッドに密着させる',
      'つま先はやや外向きにして膝と軸を揃える'
    ),
    jsonb_build_array(
      '息を吸いながらお尻とハムストリングスを伸ばす意識で下げる',
      '踵で押し出しヒップドライブで戻る',
      'トップで膝をロックせずテンションを維持する'
    ),
    '下降で吸い、押し出しで力強く吐く。',
    jsonb_build_array(
      '腰が浮いて骨盤が後傾する',
      '可動域が浅く臀部が十分に動かない',
      '膝が内側へ倒れる'
    ),
    '15 レップ到達後は重量を 5kg 目安で増やし 10 レップから再構築する。'
  ),
  (
    'machine-seated-leg-curl',
    'シーテッドレッグカール',
    'lower-isolation',
    array['ハムストリングス'],
    array['腓腹筋'],
    'knee-flexion',
    3, 3, 12, 15, 1, 2, 90, 120,
    jsonb_build_array(
      '膝の軸とマシンの回転軸を一致させる',
      '足首パッドをアキレス腱上に合わせ太ももを固定する',
      '背中をパッドに密着させ骨盤を安定させる'
    ),
    jsonb_build_array(
      '息を吐きながらかかとをお尻に引き寄せる',
      'ボトムで1〜2秒静止し収縮を感じる',
      '戻しはハムストリングスを伸ばしながらコントロールする'
    ),
    '引き寄せで吐き、戻しで吸う。',
    jsonb_build_array(
      '腰が浮いて体が反る',
      'つま先が不安定で脚が外旋する',
      '重量が重すぎて反動を使う'
    ),
    '15 レップを RIR 1-2 で揃えたら重量を増やし 12 レップから再スタート。'
  ),
  (
    'machine-adductor',
    'アダクターマシン',
    'lower-isolation',
    array['内転筋群'],
    array['骨盤底筋'],
    'hip-adduction',
    3, 3, 12, 15, 1, 2, 90, 120,
    jsonb_build_array(
      '背中をパッドに密着させ膝内側にパッドを当てる',
      '可動域を柔軟性に合わせて設定する',
      '骨盤を立て体幹を安定させる'
    ),
    jsonb_build_array(
      '息を吐きながら内ももで脚を閉じる',
      'トップで1秒静止し内転筋の収縮を高める',
      '戻しは可動域いっぱいまでゆっくり開く'
    ),
    '閉じる局面で吐き、戻す局面で吸う。',
    jsonb_build_array(
      '反動で勢いよく閉じる',
      '前傾しすぎて腰に負担がかかる',
      'つま先が外を向き内転筋から負荷が逃げる'
    ),
    '15 レップを達成したら重量を増やし 12 レップから積み上げる。'
  )
on conflict (id) do update set
  machine_name = excluded.machine_name,
  category = excluded.category,
  primary_muscles = excluded.primary_muscles,
  secondary_muscles = excluded.secondary_muscles,
  movement_pattern = excluded.movement_pattern,
  target_sets_min = excluded.target_sets_min,
  target_sets_max = excluded.target_sets_max,
  target_reps_min = excluded.target_reps_min,
  target_reps_max = excluded.target_reps_max,
  target_rir_min = excluded.target_rir_min,
  target_rir_max = excluded.target_rir_max,
  rest_seconds_min = excluded.rest_seconds_min,
  rest_seconds_max = excluded.rest_seconds_max,
  setup_steps = excluded.setup_steps,
  execution_cues = excluded.execution_cues,
  breathing_cues = excluded.breathing_cues,
  common_mistakes = excluded.common_mistakes,
  progression_notes = excluded.progression_notes;

alter table public.training_session_sets
  add column if not exists target_reps_min smallint,
  add column if not exists target_reps_max smallint,
  add column if not exists target_rir_min smallint,
  add column if not exists target_rir_max smallint,
  add column if not exists progression_goal text,
  add column if not exists progression_notes text;

update public.training_session_sets
set
  target_reps_min = coalesce(target_reps_min, nullif(substring(target_reps from '([0-9]+)'), '')::smallint),
  target_reps_max = coalesce(
    target_reps_max,
    coalesce(substring(target_reps from '-\s*([0-9]+)')::smallint, substring(target_reps from '([0-9]+)')::smallint)
  ),
  target_rir_min = coalesce(target_rir_min, nullif(substring(target_rir from '([0-9]+)'), '')::smallint),
  target_rir_max = coalesce(
    target_rir_max,
    coalesce(substring(target_rir from '-\s*([0-9]+)')::smallint, substring(target_rir from '([0-9]+)')::smallint)
  );
