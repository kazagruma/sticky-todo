export const categories = ["テキスト", "イラスト", "ゲーム", "動画", "ウェブ", "SNS", "受注", "その他"] as const;
export const priorities = ["至急", "急", "並", "やったほうがいい", "やれたらやる"] as const;
export type Category = string; export type Priority = typeof priorities[number];
export type Task = { id: string; category: Category; title: string; body: string; dueDate: string | null; priority: Priority; createdAt: string; done: boolean; doneAt: string | null; locked: boolean };
export type TaskDraft = Omit<Task, "id" | "createdAt" | "done" | "doneAt" | "locked">;
