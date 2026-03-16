# オフィスレイアウトAI診断

不動産仲介担当者向けのAI提案書生成ツールです。物件情報を入力するだけで、Claude AIがオフィスレイアウト提案書を自動生成します。

- ログイン不要・URLを渡すだけで誰でも使える
- ストリーミング対応（リアルタイムで提案書が生成される）
- スマホ対応（現場でそのまま使える）

---

## セットアップ手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/YOUR_USERNAME/office-layout-ai.git
cd office-layout-ai
```

### 2. 依存パッケージをインストール

```bash
npm install
```

### 3. 環境変数を設定

`.env.local.example` をコピーして `.env.local` を作成します。

```bash
cp .env.local.example .env.local
```

`.env.local` を開いて以下を設定してください：

```env
# Anthropic APIキー（必須）
# https://console.anthropic.com/ で取得
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxx

# CTAボタンのリンク先URL（問い合わせフォームなど）
NEXT_PUBLIC_CTA_URL=https://example.com/contact
```

### 4. 開発サーバーを起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開くと動作確認できます。

---

## Vercelへのデプロイ

### 方法1：Vercel CLIを使う

```bash
npm install -g vercel
vercel
```

### 方法2：Vercel管理画面からデプロイ

1. vercel.com にログイン
2. 「New Project」→ GitHubリポジトリを選択
3. 「Environment Variables」に以下を追加：
   - `ANTHROPIC_API_KEY` : Anthropic APIキー
   - `NEXT_PUBLIC_CTA_URL` : CTAボタンのリンク先URL
4. 「Deploy」をクリック

---

## ファイル構成

```
office-layout-ai/
├── app/
│   ├── page.tsx              # メインページ
│   ├── layout.tsx            # ルートレイアウト
│   ├── globals.css           # グローバルスタイル
│   └── api/
│       └── layout/
│           └── route.ts      # AIレイアウト生成API（サーバーサイド）
├── components/
│   ├── InputForm.tsx         # 物件情報入力フォーム
│   ├── ResultDisplay.tsx     # AI生成結果の表示
│   └── CTAButton.tsx         # 詳細提案依頼CTAボタン
├── .env.local.example        # 環境変数テンプレート
└── README.md                 # このファイル
```

---

## 入力項目

| 項目 | 説明 |
|------|------|
| 面積（㎡） | 物件の床面積（数値） |
| 希望人数（名） | 利用予定人数（数値） |
| 用途 | 執務中心 / 会議室多め / フリーアドレス / ショールーム併設 |
| 予算感 | 〜500万 / 500〜1000万 / 1000〜3000万 / 3000万〜 / 未定 |
| 移転時期 | 1〜3ヶ月 / 3〜6ヶ月 / 6〜12ヶ月 / 1年以上 / 未定 |

---

## 使用技術

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Anthropic SDK (@anthropic-ai/sdk)
- Claude claude-opus-4-6（ストリーミング対応）
