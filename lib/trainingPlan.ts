import { z } from 'zod';

export const trainingPreferencesSchema = z.object({
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  availableDays: z.number().min(3).max(6),
  equipmentAccess: z.enum(['full-machines', 'limited-machines']),
  focusArea: z.enum(['balanced', 'upper-priority', 'lower-priority']),
  includeIsolation: z.boolean().default(true)
});

export type TrainingPreferences = z.infer<typeof trainingPreferencesSchema>;

export type SetPrescription = {
  sets: number;
  reps: string;
  repsMin: number;
  repsMax: number;
  rir: string;
  rirMin: number;
  rirMax: number;
  rest: string;
  restSeconds: number;
  restSecondsMin: number;
  restSecondsMax: number;
};

export type Exercise = {
  id: string;
  name: string;
  primaryMuscles: string[];
  prescription: SetPrescription;
  notes?: string;
  technique?: ExerciseTechnique;
};

export type Session = {
  id: string;
  title: string;
  emphasis: string;
  exercises: Exercise[];
};

export type WeeklyPlan = {
  split: 'upper-lower';
  totalVolumeTargetPerMuscle: number;
  sessions: Session[];
  recommendations: string[];
};

export type ExerciseTechnique = {
  setup: string[];
  execution: string[];
  breathing?: string | null;
  mistakes: string[];
  progression?: string | null;
};

const EXERCISE_TECHNIQUE: Record<string, ExerciseTechnique> = {
  'machine-chest-press': {
    setup: [
      'シートはグリップが胸の中央に来る高さに設定し、背中と腰をパッドに密着させる。',
      '肩甲骨は寄せて下げ、足裏全体を床に着けて体幹を安定させる。',
      'グリップは手首がまっすぐになる位置で余裕を持って握る。'
    ],
    execution: [
      '胸を張ったまま肘が手首の真下を通る軌道で押し出す。',
      '押し切ったら肘をロックせずソフトに止め、胸の収縮を感じる。',
      '戻しは2〜3秒かけてコントロールし、胸にストレッチが入る位置まで下ろす。'
    ],
    breathing: '押し出す局面で息を吐き、戻す局面で息を吸う。動作前に腹圧を高めて体幹を固定する。',
    mistakes: [
      '肩が前に抜けて丸まり、大胸筋から負荷が逃げる。',
      '反動を使って勢いで押し、軌道がずれる。',
      '手首を反らせたり、肘を完全にロックして関節に負担をかける。'
    ],
    progression: '胸を張ったセットアップを崩さずにレップ上限を達成できたら、次回は最小単位で重量を増やす。'
  },
  'machine-shoulder-press': {
    setup: [
      'シートはグリップが肩〜耳の高さに来る位置に設定し、足裏を床に安定させる。',
      '腰と背中をパッドに預け、肋骨を締めてニュートラルスパインを維持する。',
      '肘が手首の真下に揃うグリップ幅で握り、手首を立てて保持する。'
    ],
    execution: [
      '肩をすくめずに真上へ押し上げ、肘を軽く残して止める。',
      '押し上げる途中で肘を体の前に押し出さず、耳の前後で軌道を保つ。',
      '戻しはゆっくり耳の高さまで下ろし、下部で胸を張った姿勢を崩さない。'
    ],
    breathing: '押し上げながら息を吐き、下ろしながら息を吸う。挙上直前に軽く息を止めて体幹を固める。',
    mistakes: [
      '腰を反りすぎて肋骨が開き、腰椎に負担をかける。',
      '肩をすくめて僧帽筋に頼り、三角筋に効かせられない。',
      '可動域を欲張りすぎて肘を深く下げ、肩関節を痛める。'
    ],
    progression: '肘と手首のスタックを維持したままレップ上限をこなせたら、次回は小幅に負荷を上げる。'
  },
  'pec-deck': {
    setup: [
      'シートを調整してハンドルが胸の高さに来るように座る。',
      '背中と腰をパッドに密着させ、肩甲骨を軽く寄せて安定させる。',
      '肘をわずかに曲げたまま同じ角度を保ち、前腕をパッドに密着させる。'
    ],
    execution: [
      '胸の中心で腕を合わせるイメージで、肘を弧を描くように閉じる。',
      '胸の内側を絞りながら1秒静止し、収縮感を確かめる。',
      '戻しは2〜3秒かけてコントロールし、肩に痛みが出ない範囲で開く。'
    ],
    breathing: '閉じるときに息を吐き、開くときに息を吸う。胸郭を膨らませ過ぎず、体幹を安定させる。',
    mistakes: [
      '肘の角度が動いて上腕に力が逃げる。',
      '肩をすくめたり、肩甲骨を前に押し出し過ぎる。',
      '勢いで閉じてストレッチと収縮を感じられない。'
    ],
    progression: '肩が安定したまま内側の収縮を感じられる重量でレップ上限を達成したら、次回は微増する。'
  },
  'machine-triceps-press': {
    setup: [
      'ケーブルを高い位置にセットし、足を肩幅で立ってわずかに前傾する。',
      '肘を体側に固定し、上腕が床と垂直の位置をキープする。',
      '手首をまっすぐ保ち、バーを軽く握って前腕の緊張を抜く。'
    ],
    execution: [
      '肘を動かさずに前腕だけでバーを押し下げ、下で1秒三頭筋を締める。',
      '押し下げたら肘をロックせず、上腕三頭筋の収縮を感じる。',
      '戻しは肘が動かない範囲でコントロールし、90度付近まで戻す。'
    ],
    breathing: '押し下げながら息を吐き、戻しながら息を吸う。動作前に軽く腹圧を入れて体幹を安定させる。',
    mistakes: [
      '肘が前後に動き、肩や広背筋が主導してしまう。',
      '上半身の反動を使って下ろし、負荷が抜ける。',
      '手首が反って痛みが出る。'
    ],
    progression: '肘の固定を保ったままレップ上限が余裕になったら、ハンドルや重量を微調整して刺激を高める。'
  },
  'machine-lateral-raise': {
    setup: [
      'シートを調整して肩関節とマシンの回転軸を合わせる。',
      '胸を張り肩を下げ、上腕外側をパッドに密着させる。',
      '軽く肘を曲げた位置で固定し、足裏を床に着けて安定させる。'
    ],
    execution: [
      '肘を外に遠くへ運ぶイメージで肩の高さまでスムーズに引き上げる。',
      'トップで僧帽筋に力が逃げない範囲で1秒キープする。',
      '戻しは肩の緊張を抜かないようにゆっくりと下ろす。'
    ],
    breathing: '持ち上げながら息を吐き、下ろしながら息を吸う。体幹はリラックスさせつつ腹圧で上体を安定させる。',
    mistakes: [
      '肩がすくみ僧帽筋が主導してしまう。',
      '勢いよく振って反動で上げる。',
      '重すぎて腕が体の前後に流れ、三角筋に効かなくなる。'
    ],
    progression: '肩をすくめずコントロールできる重量のままレップ上限を達成してから、少しずつ負荷を増やす。'
  },
  'machine-leg-press-standard': {
    setup: [
      'シートを調整して膝角度が約90度になる位置でスタートする。',
      '足は肩幅でつま先をやや外に向け、踵をプラットフォームにしっかり乗せる。',
      '背中と骨盤をパッドに密着させ、ハンドルを握って体幹を安定させる。'
    ],
    execution: [
      '腹圧を入れたまま踵でプレートを押し、膝を伸ばしすぎずに挙上する。',
      '挙上後は膝をソフトに保ち、股関節と膝が同時に伸びる感覚を意識する。',
      '戻しは2〜3秒かけて膝が胸を超えない深さまでコントロールする。'
    ],
    breathing: '下ろす前に息を吸って腹圧を高め、押し上げながらゆっくり吐き出す。',
    mistakes: [
      '膝を完全にロックアウトして関節に体重を乗せる。',
      '腰やお尻がシートから浮き、腰椎を丸めてしまう。',
      '膝が内側に倒れてニーインする。'
    ],
    progression: 'フォームを崩さずにレップ上限をこなせたら、次回は5kg未満の小幅な負荷増で進行する。'
  },
  'machine-leg-extension': {
    setup: [
      '背もたれを調整し、膝の回転軸とマシンの軸を正確に合わせる。',
      '足首パッドは足の甲とすねの境目に当たるように設定する。',
      'ハンドルを握り、腰をパッドに押し付けて上半身を固定する。'
    ],
    execution: [
      '大腿四頭筋を意識して膝を伸ばし、トップで1秒間収縮を感じる。',
      'つま先は天井へ向け、脚が揃ったまま動かす。',
      '戻しはゆっくりと制御し、負荷が抜ける直前で止める。'
    ],
    breathing: '伸ばすときに息を吐き、戻すときに息を吸う。動作を始める前に腹圧を軽くかける。',
    mistakes: [
      '勢いよく蹴り上げて膝に衝撃を与える。',
      'お尻がシートから浮き、腰を反らせる。',
      '膝を完全にロックして関節に負担をかける。'
    ],
    progression: '膝の違和感が出ない負荷でレップ上限を達成できたら、次回は1〜2.5kgずつ段階的に増やす。'
  },
  'machine-abductor': {
    setup: [
      'シートに深く座り、背中と骨盤をパッドに密着させる。',
      '脚の外側にパッドが当たる位置でスタート幅を調整する。',
      'ハンドルまたはシート側面を握って体を安定させる。'
    ],
    execution: [
      '中臀筋を意識して膝を外へ開き、トップで1秒静止する。',
      '腰を反らせず骨盤を立てたまま動作する。',
      '戻しは重力に任せず、内ももにテンションを感じながらゆっくり閉じる。'
    ],
    breathing: '開くときに息を吐き、戻すときに息を吸う。骨盤を固定するために軽く腹圧を入れる。',
    mistakes: [
      '勢いよく反動を使って開き、可動域だけを求める。',
      'つま先が上や外を向き、中臀筋から負荷が逸れる。',
      '上体を後ろへ倒し過ぎて腰が反る。'
    ],
    progression: '骨盤を立てた姿勢で開閉をコントロールできたら、可動域を保ったまま重量を徐々に増やす。'
  },
  'machine-abdominal-crunch': {
    setup: [
      'シートを調整して胸パッドまたはハンドルが胸の中央に触れる高さにする。',
      '骨盤をニュートラルに保ち、背中全体をパッドに密着させる。',
      '足をフットレストに置き、腕や肩の力を抜いて腹筋で構える。'
    ],
    execution: [
      '息を吐きながら肋骨を骨盤に近づけるイメージで背骨を丸める。',
      'おへそを覗き込み、トップで腹直筋を1秒締める。',
      '戻しは腹筋の緊張を残したままゆっくりと伸ばしきらない。'
    ],
    breathing: '丸めながら息を吐ききり、戻しながら鼻から吸って再び腹圧を整える。',
    mistakes: [
      '股関節から曲げて体を倒し、腸腰筋に負荷が逃げる。',
      'ハンドルや腕で引っ張り、腹筋を使わない。',
      '戻しで腰を反らせ、腹圧が抜ける。'
    ],
    progression: '腹筋だけでコントロールできる重量でレップ上限を達成したら、次回は少しだけ負荷か可動域を増やす。'
  },
  'machine-lat-pulldown': {
    setup: [
      '膝パッドを調整して脚が固定される高さに合わせる。',
      '肩幅よりやや広いグリップでバーを握り、胸を張って座る。',
      '背骨を伸ばし、上体をわずかに後傾させて目線は斜め上に向ける。'
    ],
    execution: [
      '肩甲骨を下げてから肘を腰へ引き付け、バーを鎖骨の前まで引き下げる。',
      '引き切ったら胸を張ったまま1秒静止して広背筋を収縮させる。',
      '戻しは肩がすくまない範囲でゆっくり伸ばし、負荷が抜ける直前で切り返す。'
    ],
    breathing: '引くときに息を吐き、戻すときに息を吸う。動作の最初に軽く腹圧を入れて上体を安定させる。',
    mistakes: [
      '腕主導で引いて肩が前に出る。',
      '上体を大きく反らせて反動を使う。',
      'バーを首の後ろへ引き、肩関節にストレスをかける。'
    ],
    progression: '肩甲骨の下制と肘の軌道を維持したままレップ上限をこなせたら、次回は微増で負荷を上げる。'
  },
  'machine-seated-row': {
    setup: [
      'シートとフットプレートを調整し、腕がまっすぐ伸びる位置でグリップを握る。',
      '胸を張り、背骨をニュートラルに保ったまま股関節をわずかに前傾させる。',
      '足裏全体をプレートに乗せ、ハンドルを軽く握って肩を下げる。'
    ],
    execution: [
      '肩甲骨を後ろへ寄せてから肘を体側に沿わせて引き、みぞおち付近へハンドルを当てる。',
      '引き切ったら胸を落とさずに1秒キープして背中の収縮を感じる。',
      '戻しは肩甲骨を前に滑らせ過ぎないようにゆっくり伸ばす。'
    ],
    breathing: '引くときに息を吐き、戻すときに息を吸う。体幹を固めて腰の丸まりを防ぐ。',
    mistakes: [
      '上体が揺れて反動で引いてしまう。',
      '背中が丸まり、肩がすくんでしまう。',
      '肘が外へ開き過ぎて僧帽筋上部に負荷が逃げる。'
    ],
    progression: '胸を張った姿勢を崩さずにレップ上限を達成できたら、レンジを保ったまま重量を少し増やす。'
  },
  'machine-rear-delt': {
    setup: [
      'マシンを前向きにまたぎ、胸をパッドに預ける。',
      'ハンドルまたはパッドが肩の高さに来るシート位置を選ぶ。',
      '肘を軽く曲げ、肩甲骨をニュートラルに保ったまま構える。'
    ],
    execution: [
      '肘を外側へ遠くに押し出すイメージで腕を後方へ開く。',
      'トップで三角筋後部に収縮を感じながら1秒静止する。',
      '戻しは胸をパッドに押し付けたままゆっくり制御する。'
    ],
    breathing: '開くときに息を吐き、戻すときに息を吸う。体幹はリラックスさせつつ胸をパッドに固定する。',
    mistakes: [
      '肩甲骨を寄せすぎて僧帽筋や菱形筋が主導する。',
      '重すぎて身体の反動を使い、対象筋の緊張が抜ける。',
      '可動域が狭く、肘が後ろへ引けていない。'
    ],
    progression: '肩甲骨を過度に動かさずに後部三角筋でコントロールできたら、徐々に重量を増やす。'
  },
  'machine-biceps-press': {
    setup: [
      'シートを調整し、肘の回転軸とマシンの軸を揃える。',
      '上腕をパッドに密着させ、胸を張って背中をパッドに寄せる。',
      '手首をまっすぐに保った逆手グリップでバーを握る。'
    ],
    execution: [
      '上腕二頭筋を意識して肘を曲げ、トップで1秒力こぶを締める。',
      '動作中は肘をパッドから離さず、肩を前に出さない。',
      '戻しはゆっくりと行い、伸ばし切る手前で止めて緊張を維持する。'
    ],
    breathing: '巻き上げるときに息を吐き、戻すときに息を吸う。腹圧で上体を固定する。',
    mistakes: [
      '身体を揺らして反動で持ち上げる。',
      '肘が前方へ動き、肩関節に頼ってしまう。',
      '手首を曲げすぎて前腕にストレスがかかる。'
    ],
    progression: '肘の固定を維持したままレップ上限をこなせたら、次回は小さな重量増やテンポ調整で刺激を高める。'
  },
  'machine-rotary-torso': {
    setup: [
      '回転角度を無理のない範囲に設定し、ターゲット側と反対方向からスタートする。',
      'シートに深く座り、骨盤と太ももをパッドでしっかり固定する。',
      '背筋を伸ばし、胸の前のパッドやハンドルを軽く抱える。'
    ],
    execution: [
      '息を吐きながら胸郭を中心に上半身を回旋し、腹斜筋の収縮を感じる。',
      'トップで腰を捻らずに1秒静止し、体幹で姿勢を支える。',
      '戻しは反動を使わずにゆっくりとスタート位置へ戻す。'
    ],
    breathing: '回旋中に息を吐ききり、戻しながら吸う。動作中も骨盤を動かさないよう腹圧を維持する。',
    mistakes: [
      '腰椎から捻ろうとして腰に負担をかける。',
      '勢いで左右に振り回し、筋肉の緊張が抜ける。',
      '腕や肩の力でマシンを動かす。'
    ],
    progression: '胸郭からの回旋を保ったままコントロールできたら、角度か重量を段階的に増やす。'
  },
  'machine-leg-press-high': {
    setup: [
      'シート位置を調整し、膝が胸を圧迫し過ぎない深さで構える。',
      '足を肩幅〜やや広めに開き、プレートの上部に踵を置いてつま先を軽く外に向ける。',
      '背中と骨盤をパッドに密着させ、ハンドルを握り体幹を固定する。'
    ],
    execution: [
      '股関節を引き込みながらウエイトを下ろし、臀部とハムストリングスの伸びを感じる。',
      '踵でプレートを押し出し、股関節主導で脚を伸ばす。膝はロックしない。',
      '可動域を急いで反転させず、2〜3秒かけてコントロールする。'
    ],
    breathing: '下ろす前に息を吸って腹圧を高め、押し出しながら息を吐く。',
    mistakes: [
      'お尻がパッドから浮き、腰が丸まる。',
      '膝が内側に倒れるか、つま先と向きがずれる。',
      '重量を急激に落として反動で切り返す。'
    ],
    progression: '臀部とハムストリングスのストレッチを感じながらレップ上限が安定したら、少しずつ重量を増やす。'
  },
  'machine-seated-leg-curl': {
    setup: [
      '背もたれとシートを調整し、膝の回転軸をマシンの軸に合わせる。',
      '足首パッドはアキレス腱の少し上に当たる位置に設定する。',
      '太もも固定パッドをしっかり下ろし、腰と背中をパッドに密着させる。'
    ],
    execution: [
      'ハムストリングスを意識してかかとをお尻に引き寄せ、下で1秒収縮させる。',
      '動作中は腰を反らせず、骨盤を安定させる。',
      '戻しは膝が伸び切る直前で切り返し、テンションを保つ。'
    ],
    breathing: '曲げるときに息を吐き、戻すときに息を吸う。腹圧を保って腰を守る。',
    mistakes: [
      '重量が重すぎて体が浮き、腰が反る。',
      '反動で引き、対象筋の緊張が抜ける。',
      '足首を強く伸ばしてふくらはぎに頼る。'
    ],
    progression: '腰が浮かずにレップ上限をこなせたら、1〜2.5kgずつ重量を増やしていく。'
  },
  'machine-adductor': {
    setup: [
      'シートに深く座り、脚の内側がパッドに均等に当たるよう調整する。',
      '開始位置は無理なく脚を開ける範囲に設定し、背中をパッドに密着させる。',
      'ハンドルやシート側面を握って骨盤を安定させる。'
    ],
    execution: [
      '内転筋で膝を閉じ、トップで1秒間しっかり締める。',
      '背中を丸めず、骨盤を立てたまま動作する。',
      '戻しは重力に任せずゆっくり開き、ストレッチを感じる。'
    ],
    breathing: '閉じながら息を吐き、開きながら息を吸う。骨盤を動かさないよう軽く腹圧を入れる。',
    mistakes: [
      '勢いで脚を開閉し、可動域だけを追い求める。',
      '上体を倒して骨盤が後傾し、内転筋のテンションが抜ける。',
      'つま先が外へ開きすぎて股関節がねじれる。'
    ],
    progression: '姿勢を崩さずにコントロールできる重量でレップ上限を達成したら、同じ可動域を保ったまま段階的に負荷を上げる。'
  }
} satisfies Record<string, ExerciseTechnique>;

export const BASE_PLAN: Session[] = [
  {
    id: 'A',
    title: 'Workout A',
    emphasis: '上半身A（プレス重視）',
    exercises: [
      {
        id: 'machine-chest-press',
        name: 'チェストプレスマシン',
        primaryMuscles: ['chest', 'triceps'],
        prescription: {
          sets: 3,
          reps: '8-12',
          repsMin: 8,
          repsMax: 12,
          rir: 'RIR 1-2',
          rirMin: 1,
          rirMax: 2,
          rest: '2-3分',
          restSeconds: 150,
          restSecondsMin: 120,
          restSecondsMax: 180
        },
        notes: '肩甲骨を寄せ胸を張ったまま押し切る',
        technique: EXERCISE_TECHNIQUE['machine-chest-press']
      },
      {
        id: 'machine-shoulder-press',
        name: 'ショルダープレスマシン',
        primaryMuscles: ['shoulders', 'triceps'],
        prescription: {
          sets: 3,
          reps: '8-12',
          repsMin: 8,
          repsMax: 12,
          rir: 'RIR 1-2',
          rirMin: 1,
          rirMax: 2,
          rest: '2-3分',
          restSeconds: 150,
          restSecondsMin: 120,
          restSecondsMax: 180
        },
        notes: '腰を反らさずに真上へ押し上げる',
        technique: EXERCISE_TECHNIQUE['machine-shoulder-press']
      },
      {
        id: 'pec-deck',
        name: 'ペックデックフライ',
        primaryMuscles: ['chest'],
        prescription: {
          sets: 3,
          reps: '10-15',
          repsMin: 10,
          repsMax: 15,
          rir: 'RIR 1-2',
          rirMin: 1,
          rirMax: 2,
          rest: '1.5-2分',
          restSeconds: 105,
          restSecondsMin: 90,
          restSecondsMax: 120
        },
        notes: '肘の角度を固定し胸の収縮に集中',
        technique: EXERCISE_TECHNIQUE['pec-deck']
      },
      {
        id: 'machine-triceps-press',
        name: 'トライセプスプレス',
        primaryMuscles: ['triceps'],
        prescription: {
          sets: 3,
          reps: '10-15',
          repsMin: 10,
          repsMax: 15,
          rir: 'RIR 1-2',
          rirMin: 1,
          rirMax: 2,
          rest: '1.5-2分',
          restSeconds: 105,
          restSecondsMin: 90,
          restSecondsMax: 120
        },
        notes: '肘を体側に固定し切り返しは丁寧に',
        technique: EXERCISE_TECHNIQUE['machine-triceps-press']
      },
      {
        id: 'machine-lateral-raise',
        name: 'マシンラテラルレイズ',
        primaryMuscles: ['shoulders'],
        prescription: {
          sets: 3,
          reps: '12-15',
          repsMin: 12,
          repsMax: 15,
          rir: 'RIR 1-2',
          rirMin: 1,
          rirMax: 2,
          rest: '1.5-2分',
          restSeconds: 105,
          restSecondsMin: 90,
          restSecondsMax: 120
        },
        notes: '肩をすくめず中部に効かせる',
        technique: EXERCISE_TECHNIQUE['machine-lateral-raise']
      }
    ]
  },
  {
    id: 'B',
    title: 'Workout B',
    emphasis: '下半身A（大腿四頭筋・臀部）',
    exercises: [
      {
        id: 'machine-leg-press-standard',
        name: 'レッグプレス（標準スタンス）',
        primaryMuscles: ['quads', 'glutes'],
        prescription: {
          sets: 4,
          reps: '8-12',
          repsMin: 8,
          repsMax: 12,
          rir: 'RIR 1-2',
          rirMin: 1,
          rirMax: 2,
          rest: '2-3分',
          restSeconds: 150,
          restSecondsMin: 120,
          restSecondsMax: 180
        },
        notes: '踵で押し膝はロックしない',
        technique: EXERCISE_TECHNIQUE['machine-leg-press-standard']
      },
      {
        id: 'machine-leg-extension',
        name: 'レッグエクステンション',
        primaryMuscles: ['quads'],
        prescription: {
          sets: 3,
          reps: '12-15',
          repsMin: 12,
          repsMax: 15,
          rir: 'RIR 1-2',
          rirMin: 1,
          rirMax: 2,
          rest: '1.5-2分',
          restSeconds: 105,
          restSecondsMin: 90,
          restSecondsMax: 120
        },
        notes: '膝軸とマシン軸を揃えトップで1秒静止',
        technique: EXERCISE_TECHNIQUE['machine-leg-extension']
      },
      {
        id: 'machine-abductor',
        name: 'アブダクターマシン',
        primaryMuscles: ['glutes'],
        prescription: {
          sets: 3,
          reps: '12-15',
          repsMin: 12,
          repsMax: 15,
          rir: 'RIR 1-2',
          rirMin: 1,
          rirMax: 2,
          rest: '1.5-2分',
          restSeconds: 105,
          restSecondsMin: 90,
          restSecondsMax: 120
        },
        notes: '骨盤を立て中臀筋でコントロール',
        technique: EXERCISE_TECHNIQUE['machine-abductor']
      },
      {
        id: 'machine-abdominal-crunch',
        name: 'マシンアブドミナルクランチ',
        primaryMuscles: ['core'],
        prescription: {
          sets: 3,
          reps: '15-20',
          repsMin: 15,
          repsMax: 20,
          rir: 'RIR 0-1',
          rirMin: 0,
          rirMax: 1,
          rest: '1-1.5分',
          restSeconds: 75,
          restSecondsMin: 60,
          restSecondsMax: 90
        },
        notes: '背骨を丸め腹直筋を収縮させる',
        technique: EXERCISE_TECHNIQUE['machine-abdominal-crunch']
      }
    ]
  },
  {
    id: 'C',
    title: 'Workout C',
    emphasis: '上半身B（プル重視）',
    exercises: [
      {
        id: 'machine-lat-pulldown',
        name: 'ラットプルダウンマシン',
        primaryMuscles: ['lats', 'biceps'],
        prescription: {
          sets: 3,
          reps: '8-12',
          repsMin: 8,
          repsMax: 12,
          rir: 'RIR 1-2',
          rirMin: 1,
          rirMax: 2,
          rest: '2-3分',
          restSeconds: 150,
          restSecondsMin: 120,
          restSecondsMax: 180
        },
        notes: '肘を体側に引き付け背中で引く',
        technique: EXERCISE_TECHNIQUE['machine-lat-pulldown']
      },
      {
        id: 'machine-seated-row',
        name: 'シーテッドローマシン',
        primaryMuscles: ['back'],
        prescription: {
          sets: 3,
          reps: '8-12',
          repsMin: 8,
          repsMax: 12,
          rir: 'RIR 1-2',
          rirMin: 1,
          rirMax: 2,
          rest: '2-3分',
          restSeconds: 150,
          restSecondsMin: 120,
          restSecondsMax: 180
        },
        notes: '胸を張り肩甲骨を引き寄せる',
        technique: EXERCISE_TECHNIQUE['machine-seated-row']
      },
      {
        id: 'machine-rear-delt',
        name: 'リアデルトフライマシン',
        primaryMuscles: ['rear-delts'],
        prescription: {
          sets: 3,
          reps: '12-15',
          repsMin: 12,
          repsMax: 15,
          rir: 'RIR 1-2',
          rirMin: 1,
          rirMax: 2,
          rest: '1.5-2分',
          restSeconds: 105,
          restSecondsMin: 90,
          restSecondsMax: 120
        },
        notes: '肩後部で開き僧帽筋の関与を抑える',
        technique: EXERCISE_TECHNIQUE['machine-rear-delt']
      },
      {
        id: 'machine-biceps-press',
        name: 'バイセプスプレス',
        primaryMuscles: ['biceps'],
        prescription: {
          sets: 3,
          reps: '10-15',
          repsMin: 10,
          repsMax: 15,
          rir: 'RIR 1-2',
          rirMin: 1,
          rirMax: 2,
          rest: '1.5-2分',
          restSeconds: 105,
          restSecondsMin: 90,
          restSecondsMax: 120
        },
        notes: '肘を固定し上腕二頭筋で巻き上げる',
        technique: EXERCISE_TECHNIQUE['machine-biceps-press']
      },
      {
        id: 'machine-rotary-torso',
        name: 'ロータリートルソー',
        primaryMuscles: ['core'],
        prescription: {
          sets: 3,
          reps: '12-15',
          repsMin: 12,
          repsMax: 15,
          rir: 'RIR 1-2',
          rirMin: 1,
          rirMax: 2,
          rest: '1-1.5分',
          restSeconds: 75,
          restSecondsMin: 60,
          restSecondsMax: 90
        },
        notes: '胸椎から捻り腰をひねらない',
        technique: EXERCISE_TECHNIQUE['machine-rotary-torso']
      }
    ]
  },
  {
    id: 'D',
    title: 'Workout D',
    emphasis: '下半身B（ハムストリングス・内転筋）',
    exercises: [
      {
        id: 'machine-leg-press-high',
        name: 'レッグプレス（ハイスタンス）',
        primaryMuscles: ['glutes', 'hamstrings'],
        prescription: {
          sets: 4,
          reps: '10-15',
          repsMin: 10,
          repsMax: 15,
          rir: 'RIR 1-2',
          rirMin: 1,
          rirMax: 2,
          rest: '2-3分',
          restSeconds: 150,
          restSecondsMin: 120,
          restSecondsMax: 180
        },
        notes: '股関節主導で押し出し臀部を使う',
        technique: EXERCISE_TECHNIQUE['machine-leg-press-high']
      },
      {
        id: 'machine-seated-leg-curl',
        name: 'シーテッドレッグカール',
        primaryMuscles: ['hamstrings'],
        prescription: {
          sets: 3,
          reps: '12-15',
          repsMin: 12,
          repsMax: 15,
          rir: 'RIR 1-2',
          rirMin: 1,
          rirMax: 2,
          rest: '1.5-2分',
          restSeconds: 105,
          restSecondsMin: 90,
          restSecondsMax: 120
        },
        notes: '膝軸を合わせハムストリングスで引き寄せる',
        technique: EXERCISE_TECHNIQUE['machine-seated-leg-curl']
      },
      {
        id: 'machine-adductor',
        name: 'アダクターマシン',
        primaryMuscles: ['adductors'],
        prescription: {
          sets: 3,
          reps: '12-15',
          repsMin: 12,
          repsMax: 15,
          rir: 'RIR 1-2',
          rirMin: 1,
          rirMax: 2,
          rest: '1.5-2分',
          restSeconds: 105,
          restSecondsMin: 90,
          restSecondsMax: 120
        },
        notes: '骨盤を立て内転筋で脚を閉じる',
        technique: EXERCISE_TECHNIQUE['machine-adductor']
      },
      {
        id: 'machine-abdominal-crunch',
        name: 'マシンアブドミナルクランチ',
        primaryMuscles: ['core'],
        prescription: {
          sets: 3,
          reps: '15-20',
          repsMin: 15,
          repsMax: 20,
          rir: 'RIR 0-1',
          rirMin: 0,
          rirMax: 1,
          rest: '1-1.5分',
          restSeconds: 75,
          restSecondsMin: 60,
          restSecondsMax: 90
        },
        notes: '体幹を丸め腹直筋で動作する',
        technique: EXERCISE_TECHNIQUE['machine-abdominal-crunch']
      }
    ]
  }
];

const EXPERIENCE_VOLUME_MODIFIER: Record<TrainingPreferences['experienceLevel'], number> = {
  beginner: 0.75,
  intermediate: 1,
  advanced: 1.15
};

export const buildPlan = (preferences: TrainingPreferences): WeeklyPlan => {
  const baseVolume = 16;
  const volumeTarget = Math.round(baseVolume * EXPERIENCE_VOLUME_MODIFIER[preferences.experienceLevel]);

  const sessions = BASE_PLAN.slice(0, Math.min(preferences.availableDays, 4)).map((session) => ({
    ...session,
    exercises: session.exercises.map((exercise) => ({
      ...exercise,
      prescription: { ...exercise.prescription }
    }))
  }));

  const recommendations: string[] = [
    '各セットのRIRは1〜3を維持して過度な疲労を避けましょう。',
    '週4〜6週後にデロード週を挟み、セット数または強度を抑えて回復させます。',
    'レップ上限に達したエクササイズは次回重量を最小単位だけ増やし、再びダブルプログレッションを繰り返します。'
  ];

  if (preferences.focusArea === 'upper-priority') {
    recommendations.push('上半身重点の場合はプル系のアクセントセットを追加し、下半身は最低限のボリュームを維持。');
  }

  if (preferences.focusArea === 'lower-priority') {
    recommendations.push('下半身重点の場合はレッグプレスやヒップスラストを追加1セット実施。');
  }

  if (!preferences.includeIsolation) {
    sessions.forEach((session, index) => {
      sessions[index] = {
        ...session,
        exercises: session.exercises.filter((exercise) => exercise.primaryMuscles.length > 1)
      };
    });
  }

  return {
    split: 'upper-lower',
    totalVolumeTargetPerMuscle: volumeTarget,
    sessions,
    recommendations
  };
};
