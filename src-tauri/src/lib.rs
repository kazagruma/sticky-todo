use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Task { id: String, category: String, title: String, body: String, due_date: Option<String>, priority: String, created_at: String, done: bool, done_at: Option<String>, locked: bool }

fn connection(path: &str) -> Result<Connection, String> {
    let conn = Connection::open(path).map_err(|e| e.to_string())?;
    conn.execute_batch("CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, category TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, due_date TEXT, priority TEXT NOT NULL, created_at TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, done_at TEXT, locked INTEGER NOT NULL DEFAULT 0);")
        .map_err(|e| e.to_string())?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at)", [])
        .map_err(|e| e.to_string())?;
    let _ = conn.execute("ALTER TABLE tasks ADD COLUMN done_at TEXT", []);
    let _ = conn.execute("ALTER TABLE tasks ADD COLUMN locked INTEGER NOT NULL DEFAULT 0", []);
    Ok(conn)
}

#[tauri::command]
fn open_database(path: String) -> Result<Vec<Task>, String> {
    let conn = connection(&path)?;
    let mut stmt = conn.prepare("SELECT id, category, title, body, due_date, priority, created_at, done, done_at, locked FROM tasks ORDER BY created_at").map_err(|e| e.to_string())?;
    let tasks = stmt.query_map([], |row| Ok(Task { id: row.get(0)?, category: row.get(1)?, title: row.get(2)?, body: row.get(3)?, due_date: row.get(4)?, priority: row.get(5)?, created_at: row.get(6)?, done: row.get::<_, i64>(7)? != 0, done_at: row.get(8)?, locked: row.get::<_, i64>(9)? != 0 }))
        .map_err(|e| e.to_string())?.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;
    Ok(tasks)
}

#[tauri::command]
fn save_tasks(path: String, tasks: Vec<Task>) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() { std::fs::create_dir_all(parent).map_err(|e| e.to_string())?; }
    let mut conn = connection(&path)?;
    let transaction = conn.transaction().map_err(|e| e.to_string())?;
    transaction.execute("DELETE FROM tasks", []).map_err(|e| e.to_string())?;
    for task in tasks { transaction.execute("INSERT INTO tasks (id, category, title, body, due_date, priority, created_at, done, done_at, locked) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)", params![task.id, task.category, task.title, task.body, task.due_date, task.priority, task.created_at, task.done as i64, task.done_at, task.locked as i64]).map_err(|e| e.to_string())?; }
    transaction.commit().map_err(|e| e.to_string())
}

pub fn run() {
    let result = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![open_database, save_tasks])
        .run(tauri::generate_context!());
    if let Err(error) = result {
        let path = std::env::temp_dir().join("sticky-todo-startup-error.txt");
        let _ = std::fs::write(path, error.to_string());
    }
}
