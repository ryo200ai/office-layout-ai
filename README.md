# オフィスレイアウトAI診断

不動産仲介担当者向けのAI提案書生成ツール。
図面をアップロードして物件情報を入力するだけで、Claude AIがその場でオフィスレイアウト提案書を自動生成します。

- ログイン不要・URLを渡すだけで誰でも使える
- ストリーミング対応（リアルタイムで提案書が生成される）
- スマホ対応（現場でそのまま使える）
- デモモード搭載（APIキーなしでサンプル出力を確認できる）
- 入力情報・詳細提案依頼を自動でメール通知

---

## アプリ概要

### 入力項目

| 項目 | 種別 | 必須 |
|------|------|------|
| 図面アップロード | 画像（PNG/JPG）またはPDF | 任意 |
| 坪数 | 数値入力（㎡換算も自動表示） | ✅ |
| 貴社名（仲介会社名） | テキスト入力 | ✅ |
| 移転先住所 | テキスト入力 | — |
| ビル名・階数 | テキスト入力 | — |
| クライアント名 | テキスト入力 | ✅ |
| 席数 | 数値入力 | ✅ |
| 会議室数・定員 | 各室の定員を記入式で複数追加可能 | — |
| テレフォンブース数 | 数値入力 | — |
| ラウンジの要否 | トグルスイッチ | — |

### AI出力（6セクション構成）

1. 物件評価サマリー（1名あたりの坪数・㎡計算含む）
2. 推奨レイアウトプラン（図面アップロード時はゾーニング提案）
3. 座席・スペース配分の目安（坪数・㎡の具体的な数字入り）
4. このプランのポイント（箇条書き3点）
5. 注意点・検討事項
6. 次のステップ

### メール通知

以下のタイミングで `ryo_takaishi@sinkodo.co.jp` へ自動送信：

- **フォーム送信時**：入力情報をまとめた「新規診断リクエスト」メール
- **CTAボタン押下時**：AI提案書抜粋を含む「詳細提案依頼」メール

---

## 使用技術

| 技術 | 用途 |
|------|------|
| Next.js 14（App Router） | フレームワーク |
| TypeScript | 型安全な開発 |
| Tailwind CSS | スタイリング |
| @anthropic-ai/sdk | Claude API（ストリーミング） |
| Resend | メール送信 |

---

## 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | Anthropic APIキー | ✅ |
| `RESEND_API_KEY` | Resend APIキー（メール送信用） | — |
| `NEXT_PUBLIC_CTA_URL` | CTAボタンのリンク先URL | — |

> `RESEND_API_KEY` が未設定の場合、メール送信はスキップされます（エラーにはなりません）。

---

## セットアップ手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/ryo200ai/office-layout-ai.git
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

# Resend APIキー（メール送信用・任意）
# https://resend.com/ で無料アカウントを作成して取得
RESEND_API_KEY=re_xxxxxxxxxxxx

# CTAボタンのリンク先URL（任意）
NEXT_PUBLIC_CTA_URL=https://example.com/contact
```

### 4. 開発サーバーを起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開くと動作確認できます。
APIキーがなくても、ヘッダーの **「▶ デモを見る」** でサンプル出力を確認できます。

---

## Vercelへのデプロイ

1. [vercel.com](https://vercel.com) にログイン
2. 「New Project」→ `ryo200ai/office-layout-ai` を選択して「Import」
3. 「Environment Variables」に以下を追加：

| 変数名 | 値 |
|--------|---|
| `ANTHROPIC_API_KEY` | Anthropic APIキー |
| `RESEND_API_KEY` | Resend APIキー |
| `NEXT_PUBLIC_CTA_URL` | 問い合わせフォームのURL |

4. 「Deploy」をクリック

---

## ファイル構成

```
office-layout-ai/
├── app/
│   ├── page.tsx                  # メインページ・デモモード
│   ├── layout.tsx                # ルートレイアウト
│   ├── globals.css               # グローバルスタイル
│   └── api/
│       ├── layout/
│       │   └── route.ts          # Claude AIレイアウト生成API
│       └── send-email/
│           └── route.ts          # Resendメール送信API
├── components/
│   ├── InputForm.tsx             # 物件情報入力フォーム（図面アップロード含む）
│   ├── ResultDisplay.tsx         # AI生成結果の表示
│   └── CTAButton.tsx             # 詳細提案依頼CTAボタン
├── .env.local.example            # 環境変数テンプレート
└── README.md                     # このファイル
```
