# Strength Training Guidance App

## Overview
個人利用を想定した筋肥大向けトレーニングガイド。Vercel 上の Next.js フロントと Supabase を組み合わせ、科学的根拠に基づく高負荷マシントレーニングプロトコルの案内と記録を行います。

## Features
- Supabase Auth を使ったメール認証
- 週4日アッパー/ロワースプリットをベースにしたトレーニングメニュー生成
- RIR とセット間休憩を明示したセット処方
- セット記録フォームとダブルプログレッション推奨
- A→B→C→D のサイクルを自動管理するトレーニング実施画面 (`/training`) と休憩タイマー
- デロード提案とボリュームモニタリング (今後実装予定)

## Project Structure
```
strength-training-guidance-app
├── app/                 # Next.js App Router ページ・レイアウト
│   ├── layout.tsx
│   ├── page.tsx
│   ├── sign-in/
│   │   └── page.tsx
│   └── training/
│       └── page.tsx
├── lib/                 # Supabase クライアントやドメインロジック
│   ├── supabaseClient.ts
│   └── trainingPlan.ts
├── docs/                # 要件定義などのドキュメント
│   └── requirements.md
├── app/globals.css      # Tailwind ベーススタイル
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── .env.local.example   # Supabase 環境変数サンプル
```

※ 旧 Express ベースのコードは `src/` に退避しています。TypeScript ではビルド対象外にしているためそのままでも動作に影響はありません。不要であれば削除してください。

## Getting Started
1. 依存関係のインストール
   ```bash
   npm install
   ```
2. Supabase プロジェクトを作成し、`.env.local` を `.env.local.example` からコピーして値を設定
3. 開発サーバー起動
   ```bash
   npm run dev
   ```
4. ブラウザで `http://localhost:3000` にアクセス

## Environment Variables
| 変数名 | 内容 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon キー |

## Build & Deploy
- `npm run build` で本番ビルド
- `npm run start` で本番サーバーを起動 (Vercel へのデプロイを推奨)

## License
MIT