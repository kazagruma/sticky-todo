#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
fn main() {
    if let Err(payload) = std::panic::catch_unwind(sticky_todo_lib::run) {
        let message = payload.downcast_ref::<&str>().map(|s| s.to_string())
            .or_else(|| payload.downcast_ref::<String>().cloned())
            .unwrap_or_else(|| "不明な起動エラー".to_string());
        let _ = std::fs::write(std::env::temp_dir().join("sticky-todo-startup-error.txt"), message);
    }
}
