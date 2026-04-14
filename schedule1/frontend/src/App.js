

import { useEffect, useState } from "react";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Login from "./Login";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(3);
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [view, setView] = useState("list");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  // ログイン状態�E確誁E  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedEmail = localStorage.getItem("userEmail");
    
    if (storedUserId && storedEmail) {
      setIsLoggedIn(true);
      setUserId(storedUserId);
      setUserEmail(storedEmail);
    }
  }, []);

  // ログイン成功時�E処琁E  const handleLoginSuccess = (id, email) => {
    setIsLoggedIn(true);
    setUserId(id);
    setUserEmail(email);
    fetchTasks(id);
  };

  // ログアウチE  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserId(null);
    setUserEmail(null);
    setTasks([]);
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
  };

  // タスク取征E  const fetchTasks = (id) => {
    fetch(`${API_URL}/api/tasks/?user_id=${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setTasks(data);
        setError("");
      })
      .catch((err) => {
        console.error("Error fetching tasks:", err);
        setError(`タスク取得に失敗しました: ${err.message}`);
      });
  };

  useEffect(() => {
    if (isLoggedIn && userId) {
      fetchTasks(userId);
    }
  }, [isLoggedIn]);

  // タスク追加
  const addTask = () => {
    if (!title.trim()) {
      setError("タスク名を入力してください");
      return;
    }
    
    const params = new URLSearchParams({
      user_id: userId,
      title: title,
      priority: priority,
      deadline: deadline || ""
    });

    fetch(`${API_URL}/api/tasks/?${params}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Task added:", data);
        setTitle("");
        setPriority(3);
        setDeadline("");
        setError("");
        fetchTasks(userId); // 再取征E      })
      .catch((err) => {
        console.error("Error adding task:", err);
        setError(`タスク追加に失敗しました: ${err.message}`);
      });
  };

  const deleteTask = (id) => {
    fetch(`${API_URL}/api/tasks/${id}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(() => {
        setError("");
        fetchTasks(userId);
      })
      .catch((err) => {
        console.error("Error deleting task:", err);
        setError(`タスク削除に失敗しました: ${err.message}`);
      });
  };

  // ログイン前�E画面
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }


  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="header-content">
          <h1>📅 Schedule Management</h1>
          <div className="header-right">
            <div className="view-buttons">
              <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>リスチE/button>
              <button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>カレンダー</button>
            </div>
            <p className="user-info">{userEmail}</p>
            <button className="logout-btn" onClick={handleLogout}>ログアウチE/button>
          </div>
        </div>
      </header>

      <main className="container">
        {error && <div className="error-message">⚠�E�E{error}</div>}

        <section className="add-task-section">
          <h2>新しいタスクを追加</h2>
          <div className="form">
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タスク名を入劁E.."
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
            />
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              placeholder="期限"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
            >
              <option value={1}>🔴 髁E/option>
              <option value={2}>🟡 中</option>
              <option value={3}>🟢 佁E/option>
            </select>
            <button className="add" onClick={addTask}>追加</button>
          </div>
        </section>

        <section className="task-list-section">
          {view === "list" ? (
            <>
              <h2>タスク一覧 ({tasks.length}件)</h2>
              {tasks.length === 0 ? (
                <p className="no-tasks">タスクがまだありません</p>
              ) : (
                <div className="task-list">
                  {tasks.map(task => {
                    const now = new Date();
                    const deadline = task.deadline ? new Date(task.deadline) : null;
                    const daysLeft = deadline ? Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)) : null;
                    const isUrgent = daysLeft !== null && daysLeft <= 3 && daysLeft > 0;
                    const isOverdue = daysLeft !== null && daysLeft <= 0;

                    return (
                    <div key={task.id} className={`task ${isOverdue ? 'overdue' : isUrgent ? 'urgent' : ''}`}>
                      <div className="task-content">
                        <span
                          className={
                            task.priority === 1
                              ? "priority-high"
                              : task.priority === 2
                              ? "priority-medium"
                              : "priority-low"
                          }
                        >
                          {isUrgent && "⚠�E�E"}
                          {isOverdue && "❁E"}
                          {task.title}
                        </span>
                        <span className="priority-badge">
                          {task.priority === 1 ? "髁E : task.priority === 2 ? "中" : "佁E}
                        </span>
                        {deadline && (
                          <span className={`deadline-badge ${isOverdue ? 'overdue-badge' : isUrgent ? 'urgent-badge' : ''}`}>
                            {daysLeft === 0 ? "今日まで" : daysLeft === 1 ? "明日まで" : daysLeft > 0 ? `残り${daysLeft}日` : "期限趁E��"}
                          </span>
                        )}
                      </div>
                      <button className="delete" onClick={() => deleteTask(task.id)}>削除</button>
                    </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="calendar-view">
              <h2>カレンダー</h2>
              <Calendar
                tileContent={({ date, view }) => {
                  if (view === 'month') {
                    const dayTasks = tasks.filter(task => {
                      if (!task.deadline) return false;
                      const taskDate = new Date(task.deadline);
                      return taskDate.toDateString() === date.toDateString();
                    });
                    return dayTasks.length > 0 ? (
                      <div className="calendar-tasks">
                        {dayTasks.slice(0, 3).map(task => (
                          <div key={task.id} className={`calendar-task priority-${task.priority}`}>
                            {task.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && <div className="more-tasks">+{dayTasks.length - 3} more</div>}
                      </div>
                    ) : null;
                  }
                }}
              />
            </div>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <p>&copy; 2026 Schedule Management App. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
