"use client";

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from 'lib/supabaseClient';

const INPUT_BASE =
  'rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

export default function SignInPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirect') ?? '/training';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password
        });

        if (signUpError) {
          throw signUpError;
        }

        setMessage('確認メールを送信しました。受信箱を確認してください。');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          throw signInError;
        }

        router.replace(redirectTo);
      }
    } catch (authError) {
      console.error(authError);
      setError(authError instanceof Error ? authError.message : '認証に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl backdrop-blur">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-primary">Strength Training Guidance</p>
          <h1 className="text-2xl font-semibold text-white">{isSignUp ? 'アカウント作成' : 'サインイン'}</h1>
          <p className="text-sm text-slate-400">Supabase 認証を利用してセッションを記録しましょう。</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs text-slate-400">メールアドレス</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={INPUT_BASE}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs text-slate-400">パスワード</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={INPUT_BASE}
            />
            <span className="text-[11px] text-slate-500">6文字以上で入力してください。</span>
          </label>

          {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</p>}
          {message && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">{message}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-40"
          >
            {isSubmitting ? '処理中...' : isSignUp ? '登録メールを送信' : 'サインイン'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          {isSignUp ? 'すでにアカウントをお持ちですか？' : 'アカウントが必要ですか？'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp((prev) => !prev);
              setError(null);
              setMessage(null);
            }}
            className="text-primary underline"
          >
            {isSignUp ? 'サインインに切り替え' : 'アカウント作成に切り替え'}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <Link href="/" className="underline hover:text-slate-300">
            ホームに戻る
          </Link>
          <span>・</span>
          <Link href="/training" className="underline hover:text-slate-300">
            トレーニングを見る
          </Link>
        </div>
      </div>
    </main>
  );
}
