import { cookies } from "next/headers";

export type Lang = "en" | "ja";

const en = {
  appName: "SHIME",
  "login.title": "Sign in to SHIME",
  "login.subtitle": "Bookkeeping for your business",
  "login.email": "Email",
  "login.password": "Password",
  "login.submit": "Sign in",
  "login.error": "Invalid email or password.",

  "nav.dashboard": "Dashboard",
  "nav.transactions": "Transactions",
  "nav.users": "Users",
  "nav.logout": "Sign out",
  "lang.switch": "日本語",

  "dashboard.title": "Dashboard",
  "dashboard.year": "Year",
  "dashboard.sales": "Sales",
  "dashboard.purchases": "Purchases",
  "dashboard.expenses": "Expenses",
  "dashboard.net": "Net",
  "dashboard.count": "transactions",
  "dashboard.recent": "Recent transactions",
  "dashboard.viewAll": "View all",
  "dashboard.empty": "No transactions yet. Add your first one.",

  "tx.title": "Transactions",
  "tx.new": "New transaction",
  "tx.editTitle": "Edit transaction",
  "tx.type": "Type",
  "tx.date": "Date",
  "tx.counterparty": "Counterparty",
  "tx.counterparty.hint": "Customer / supplier / payee",
  "tx.description": "Description",
  "tx.amount": "Amount (¥)",
  "tx.memo": "Memo",
  "tx.attachments": "Receipts / invoices",
  "tx.save": "Save",
  "tx.create": "Create",
  "tx.cancel": "Cancel",
  "tx.delete": "Delete",
  "tx.deleteConfirm": "Delete this transaction and its attached files?",
  "tx.empty": "No transactions match the current filters.",
  "tx.allTypes": "All types",
  "tx.search": "Search counterparty / description",
  "tx.filter": "Filter",
  "tx.total": "Total",
  "tx.error.required": "Please fill in date, counterparty and a positive amount.",
  "tx.saved": "Saved.",

  "type.SALE": "Sale",
  "type.PURCHASE": "Purchase",
  "type.EXPENSE": "Expense",

  "attach.upload": "Add files",
  "attach.uploadHint": "Images or PDF, up to 15 MB each",
  "attach.empty": "No files attached yet.",
  "attach.view": "View",
  "attach.download": "Download",
  "attach.delete": "Remove",
  "attach.deleteConfirm": "Remove this file?",
  "attach.error.type": "Only images and PDF files are allowed.",
  "attach.error.size": "Each file must be 15 MB or smaller.",

  "users.title": "Users",
  "users.create": "Create user",
  "users.name": "Name",
  "users.email": "Email",
  "users.password": "Password",
  "users.role": "Role",
  "users.status": "Status",
  "users.createdAt": "Created",
  "users.active": "Active",
  "users.inactive": "Inactive",
  "users.deactivate": "Deactivate",
  "users.activate": "Activate",
  "users.you": "you",
  "users.created": "User created.",
  "users.error.exists": "A user with this email already exists.",
  "users.error.required": "Name, a valid email and a password (8+ characters) are required.",

  "role.ADMIN": "Admin",
  "role.MEMBER": "Member",
} as const;

type Dict = Record<keyof typeof en, string>;

const ja: Dict = {
  appName: "SHIME",
  "login.title": "SHIME にサインイン",
  "login.subtitle": "あなたのビジネスの帳簿づけ",
  "login.email": "メールアドレス",
  "login.password": "パスワード",
  "login.submit": "サインイン",
  "login.error": "メールアドレスまたはパスワードが正しくありません。",

  "nav.dashboard": "ダッシュボード",
  "nav.transactions": "取引",
  "nav.users": "ユーザー",
  "nav.logout": "サインアウト",
  "lang.switch": "English",

  "dashboard.title": "ダッシュボード",
  "dashboard.year": "年",
  "dashboard.sales": "売上",
  "dashboard.purchases": "仕入",
  "dashboard.expenses": "経費",
  "dashboard.net": "差引",
  "dashboard.count": "件の取引",
  "dashboard.recent": "最近の取引",
  "dashboard.viewAll": "すべて表示",
  "dashboard.empty": "取引がまだありません。最初の取引を登録しましょう。",

  "tx.title": "取引",
  "tx.new": "新規取引",
  "tx.editTitle": "取引の編集",
  "tx.type": "区分",
  "tx.date": "取引日",
  "tx.counterparty": "取引先",
  "tx.counterparty.hint": "顧客・仕入先・支払先",
  "tx.description": "摘要",
  "tx.amount": "金額（円）",
  "tx.memo": "メモ",
  "tx.attachments": "領収書・請求書",
  "tx.save": "保存",
  "tx.create": "登録",
  "tx.cancel": "キャンセル",
  "tx.delete": "削除",
  "tx.deleteConfirm": "この取引と添付ファイルを削除しますか？",
  "tx.empty": "条件に一致する取引がありません。",
  "tx.allTypes": "すべての区分",
  "tx.search": "取引先・摘要を検索",
  "tx.filter": "絞り込み",
  "tx.total": "合計",
  "tx.error.required": "取引日・取引先・正の金額を入力してください。",
  "tx.saved": "保存しました。",

  "type.SALE": "売上",
  "type.PURCHASE": "仕入",
  "type.EXPENSE": "経費",

  "attach.upload": "ファイルを追加",
  "attach.uploadHint": "画像または PDF、1 ファイル 15MB まで",
  "attach.empty": "添付ファイルはまだありません。",
  "attach.view": "表示",
  "attach.download": "ダウンロード",
  "attach.delete": "削除",
  "attach.deleteConfirm": "このファイルを削除しますか？",
  "attach.error.type": "画像と PDF のみアップロードできます。",
  "attach.error.size": "1 ファイル 15MB 以下にしてください。",

  "users.title": "ユーザー",
  "users.create": "ユーザーを作成",
  "users.name": "氏名",
  "users.email": "メールアドレス",
  "users.password": "パスワード",
  "users.role": "権限",
  "users.status": "状態",
  "users.createdAt": "作成日",
  "users.active": "有効",
  "users.inactive": "無効",
  "users.deactivate": "無効化",
  "users.activate": "有効化",
  "users.you": "自分",
  "users.created": "ユーザーを作成しました。",
  "users.error.exists": "このメールアドレスのユーザーは既に存在します。",
  "users.error.required": "氏名・有効なメールアドレス・8文字以上のパスワードが必要です。",

  "role.ADMIN": "管理者",
  "role.MEMBER": "メンバー",
};

const dicts: Record<Lang, Dict> = { en, ja };

export type TKey = keyof typeof en;

export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get("shime_lang")?.value;
  return value === "ja" ? "ja" : "en";
}

export async function getT(): Promise<{ t: (key: TKey) => string; lang: Lang }> {
  const lang = await getLang();
  return { t: (key: TKey) => dicts[lang][key] ?? en[key] ?? key, lang };
}
