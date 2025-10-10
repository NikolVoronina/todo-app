"use client";

import React, { useEffect, useRef, useState } from "react";

type Priority = "low" | "medium" | "high";
type Todo = {
    id: number;
    text: string;
    done: boolean;
    priority: Priority;
    date?: string; // yyyy-mm-dd
    time?: string; // HH:MM
    color?: string; // hex
    category: string;
};

const CATEGORIES: { id: string; label: string; emoji: string }[] = [
    { id: "inbox", label: "Inbox", emoji: "📥" },
    { id: "home", label: "Home", emoji: "🏠" },
    { id: "work", label: "Work", emoji: "💼" },
    { id: "personal", label: "Personal", emoji: "🧑‍🎤" },
    { id: "shopping", label: "Shopping", emoji: "🛒" },
    { id: "other", label: "Other", emoji: "🔖" },
];

// shared constants
const BORDER = "rounded-2xl";

export default function Home() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [text, setText] = useState("");
    const [priority, setPriority] = useState<Priority>("medium");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [color, setColor] = useState("#ff8fa3");
    const [category, setCategory] = useState<string>("inbox");
    const [darkMode, setDarkMode] = useState<boolean>(() => {
        try {
            const raw = localStorage.getItem("darkMode");
            if (raw !== null) return raw === "1";
        } catch {}
        return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    });

    useEffect(() => {
        const raw = localStorage.getItem("todos");
        if (raw) {
            try {
                const parsed = JSON.parse(raw) as Partial<Todo>[];
                const normalized = parsed.map((t) => ({
                    id: t.id ?? Date.now(),
                    text: t.text ?? "",
                    done: t.done ?? false,
                    priority: (t.priority as Priority) ?? "medium",
                    date: t.date ?? undefined,
                    time: t.time ?? undefined,
                    color: t.color ?? "#ff8fa3",
                    category: t.category ?? "inbox",
                }));
                setTodos(normalized);
            } catch {
                setTodos([]);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("todos", JSON.stringify(todos));
    }, [todos]);

    useEffect(() => {
        try {
            localStorage.setItem("darkMode", darkMode ? "1" : "0");
        } catch {}
    }, [darkMode]);

    const addTodo = (e?: React.FormEvent) => {
        e?.preventDefault();
        const value = text.trim();
        if (!value) return;
        const newTodo: Todo = {
            id: Date.now(),
            text: value,
            done: false,
            priority,
            date: date || undefined,
            time: time || undefined,
            color: color || "#ff8fa3",
            category,
        };
        setTodos((prev) => [newTodo, ...prev]);
        setText("");
        setPriority("medium");
        setDate("");
        setTime("");
        setColor("#ff8fa3");
        setCategory("inbox");
    };

    const toggleDone = (id: number) => {
        setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    };

    const removeTodo = (id: number) => {
        setTodos((prev) => prev.filter((t) => t.id !== id));
    };

    const clearCompleted = () => {
        setTodos((prev) => prev.filter((t) => !t.done));
    };

    const groupByCategory = (list: Todo[]) => {
        const map = new Map<string, Todo[]>();
        for (const c of CATEGORIES) map.set(c.id, []);
        for (const t of list) {
            if (!map.has(t.category)) map.set(t.category, []);
            map.get(t.category)!.push(t);
        }
        return map;
    };

    const priorityStyle = (p: Priority) =>
        p === "high" ? "bg-pink-500" : p === "medium" ? "bg-rose-300 text-rose-900" : "bg-emerald-400 text-emerald-900";

    const grouped = groupByCategory(todos);

    // --- helpers for date/time ---
    const formatDisplayDate = (d?: string) => {
        if (!d) return "";
        try {
            const dt = new Date(d + "T00:00");
            return dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
        } catch {
            return d;
        }
    };

    const generateTimeOptions = () => {
        const list: string[] = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 30) {
                const hh = String(h).padStart(2, "0");
                const mm = String(m).padStart(2, "0");
                list.push(`${hh}:${mm}`);
            }
        }
        return list;
    };

    const timeOptions = generateTimeOptions();

    const normalizeTime = (value: string) => {
        const v = value.trim();
        if (!v) return "";
        const alt = v.replace(".", ":").replace(",", ":");
        const m = alt.match(/^(\d{1,2}):(\d{2})$/);
        if (!m) return "";
        const hh = Number(m[1]);
        const mm = Number(m[2]);
        if (hh >= 0 && hh < 24 && mm >= 0 && mm < 60) {
            return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
        }
        return "";
    };

    // compact interactive time input
    function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
        const [open, setOpen] = useState(false);
        const [local, setLocal] = useState(value);
        const ref = useRef<HTMLDivElement | null>(null);

        useEffect(() => setLocal(value), [value]);

        useEffect(() => {
            const onDoc = (e: MouseEvent) => {
                if (!ref.current) return;
                if (!(e.target instanceof Node)) return;
                if (!ref.current.contains(e.target)) setOpen(false);
            };
            document.addEventListener("mousedown", onDoc);
            return () => document.removeEventListener("mousedown", onDoc);
        }, []);

        // use darkMode from closure
        return (
            <div ref={ref} className="relative min-w-0">
                <input
                    type="text"
                    inputMode="numeric"
                    placeholder="HH:MM"
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    onFocus={() => setOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            const n = normalizeTime(local);
                            if (n) {
                                onChange(n);
                                setLocal(n);
                            }
                            setOpen(false);
                        } else if (e.key === "Escape") {
                            setLocal(value);
                            setOpen(false);
                        }
                    }}
                    onBlur={() => {
                        setTimeout(() => {
                            const n = normalizeTime(local);
                            if (n) {
                                onChange(n);
                                setLocal(n);
                            } else {
                                setLocal(value);
                            }
                            setOpen(false);
                        }, 120);
                    }}
                    className={`w-full md:w-28 px-3 py-2 border border-pink-100 ${BORDER} focus:outline-none`}
                    aria-label="Time (HH:MM)"
                />

                {open && (
                    <div
                        className={`absolute top-full mt-2 left-0 z-50 w-full md:w-44 max-h-44 overflow-auto border ${BORDER}`}
                        style={{
                            boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                            background: darkMode ? "linear-gradient(180deg,#041316,#071a14)" : "#fff",
                            color: darkMode ? "#e6f6ef" : undefined,
                            borderColor: darkMode ? "rgba(255,255,255,0.03)" : undefined,
                        }}
                    >
                        <div className="p-2">
                            {timeOptions.map((t) => (
                                <button
                                    key={t}
                                    onMouseDown={(ev) => {
                                        ev.preventDefault();
                                        onChange(t);
                                        setLocal(t);
                                        setOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-md ${darkMode ? "hover:bg-[#04221a]" : "hover:bg-pink-50"}`}
                                    style={{ color: darkMode ? "#e6f6ef" : undefined }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // theme helpers
    // dark-mode gradient kept; light-mode gradient adjusted to a pink variant (same style)
    const rootBg = darkMode
        ? "bg-gradient-to-b from-[#111317] to-[#083f2e]"
        : "bg-gradient-to-b from-[#fff6fb] via-[#fff0f6] to-[#fffafc]";
    const mainBgStyle = darkMode
        ? { background: "linear-gradient(180deg, rgba(8,10,12,0.82), rgba(6,20,16,0.82))", color: "#e6f6ef" }
        : undefined;
    const textColor = darkMode ? "text-slate-200" : "text-slate-900";

    return (
        <div
            style={{ fontFamily: "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}
            className={`min-h-screen flex items-start justify-center py-12 px-4 ${rootBg}`}
        >
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');`}</style>

            <div className="w-full max-w-6xl">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${BORDER} bg-gradient-to-br from-pink-400 to-emerald-300 flex items-center justify-center shadow-md`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                                <path d="M4 7h16M4 12h10M4 17h16" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <h1 className={`text-4xl font-bold ${textColor}`}>Tasks & Planner</h1>
                            <p className={`text-sm mt-0.5 ${darkMode ? "text-slate-300" : "text-slate-600"}`}></p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{todos.length} total</div>

                        <button
                            onClick={() => setDarkMode((s) => !s)}
                            className={`px-3 py-2 text-sm ${BORDER}`}
                            style={{
                                background: darkMode ? "#0f1724" : "#fff",
                                border: darkMode ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.04)",
                                color: darkMode ? "#fff" : "#111827",
                            }}
                            title="Toggle dark mode"
                        >
                            {darkMode ? "🌙 Dark" : "☀️ Light"}
                        </button>

                        <button
                            onClick={clearCompleted}
                            className={`${BORDER} px-3 py-2 text-sm`}
                            style={{
                                background: darkMode ? "rgba(255,20,100,0.06)" : "#fff3f5",
                                border: "1px solid rgba(255,182,193,0.25)",
                                color: "#ec4899",
                            }}
                        >
                            Clear completed
                        </button>
                    </div>
                </header>

                <main
                    className={`${BORDER} shadow-xl p-6`}
                    style={{ ...(mainBgStyle ?? {}), ...(darkMode ? { border: "1px solid rgba(255,255,255,0.04)" } : {}) }}
                >
                    {/* Task row (full width) */}
                    <form onSubmit={addTodo} className="grid grid-cols-1 md:grid-cols-8 gap-3 items-end mb-4">
                        <div className="md:col-span-8">
                            <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Task</label>
                            <input
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Write your task"
                                className={`w-full px-4 py-3 border border-transparent ${BORDER} shadow-sm focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-emerald-200" : "focus:ring-pink-200"} ${darkMode ? "bg-[#061014] text-slate-100" : "bg-white text-slate-800"}`}
                            />
                        </div>

                        {/* controls row (under Task) */}
                        <div className="md:col-span-1">
                            <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as Priority)}
                                className={`w-full px-3 py-2 border border-transparent ${BORDER} ${darkMode ? "bg-[#071318] text-slate-100" : "bg-white text-slate-800"}`}
                            >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className={`w-full px-3 py-2 border border-transparent ${BORDER} ${darkMode ? "bg-[#071318] text-slate-100" : "bg-white text-slate-800"}`}
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-3 min-w-0">
                            <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Date</label>
                            <div className="relative">
                                <svg className="absolute left-3 top-3 w-5 h-5 text-pink-400" viewBox="0 0 24 24" fill="none">
                                    <path d="M7 11h10M7 16h6M8 7V5M16 7V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                    <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
                                </svg>

                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className={`w-full pl-10 pr-3 py-2 border-2 border-transparent ${BORDER} focus:outline-none min-w-0`}
                                    style={{
                                        background: darkMode ? "linear-gradient(90deg, rgba(255,142,163,0.03), rgba(74,222,128,0.02))" : "linear-gradient(90deg, rgba(255,142,163,0.06), rgba(167,243,208,0.04))",
                                        borderImageSlice: 1,
                                        borderImageSource: "linear-gradient(90deg, #ff8fa3, #4ade80)",
                                        color: darkMode ? "#e6f6ef" : undefined,
                                    }}
                                />
                            </div>
                            {date ? (
                                <div className={`${BORDER} mt-2 inline-flex items-center gap-2 px-3 py-1 text-xs font-medium`} style={{ background: darkMode ? "#072a20" : "linear-gradient(90deg,#ffd7df,#dfffe8)" }}>
                                    <span className="text-pink-600">📅</span>
                                    <span className={darkMode ? "text-slate-200" : "text-slate-700"}>{formatDisplayDate(date)}</span>
                                </div>
                            ) : (
                                <div className={`mt-1 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}></div>
                            )}
                        </div>

                        <div className="md:col-span-2 min-w-0">
                            <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Time</label>

                            <TimeInput
                                value={time}
                                onChange={(v) => {
                                    const n = normalizeTime(v);
                                    if (n) setTime(n);
                                    else setTime(v);
                                }}
                            />

                            {time ? (
                                <div className={`${BORDER} mt-2 inline-flex items-center gap-2 px-3 py-1 text-xs font-medium`} style={{ background: darkMode ? "#072a20" : "linear-gradient(90deg,#ffeef2,#e8fff0)" }}>
                                    <span className="text-pink-600">⏰</span>
                                    <span className={darkMode ? "text-slate-200" : "text-slate-700"}>{time}</span>
                                </div>
                            ) : (
                                <div className={`mt-1 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}></div>
                            )}
                        </div>

                        {/* action row */}
                        <div className="md:col-span-8 flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-2">
                                <label className={`text-xs font-medium ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Color</label>
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className={`${BORDER}`}
                                    aria-label="Task color"
                                />
                            </div>

                            <div className="ml-auto flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setText("");
                                        setPriority("medium");
                                        setDate("");
                                        setTime("");
                                        setColor("#ff8fa3");
                                        setCategory("inbox");
                                    }}
                                    className={`px-4 py-2 text-sm ${BORDER}`}
                                    style={{
                                        border: "1px solid rgba(0,0,0,0.04)",
                                        background: darkMode ? "#071318" : "transparent",
                                        color: darkMode ? "#e6f6ef" : "#111827",
                                    }}
                                >
                                    Reset
                                </button>

                                <button
                                    type="submit"
                                    className={`px-4 py-2 text-white ${BORDER} shadow-md flex items-center gap-2`}
                                    style={{ background: "linear-gradient(90deg,#ff3b7a,#34d399)" }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add task
                                </button>
                            </div>
                        </div>
                    </form>

                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {CATEGORIES.map((cat) => {
                            const items = grouped.get(cat.id) ?? [];
                            return (
                                <div
                                    key={cat.id}
                                    className={`${BORDER} p-4 shadow-md border`}
                                    style={{
                                        minHeight: 140,
                                        background: darkMode ? "linear-gradient(180deg,#071318,#051816)" : "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,245,247,0.9))",
                                        borderColor: darkMode ? "rgba(255,255,255,0.03)" : "rgba(255,182,193,0.12)",
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`${BORDER} w-10 h-10 bg-white/6 flex items-center justify-center shadow-inner`} style={{ border: "1px solid rgba(255,255,255,0.03)" }}>
                                                <div className="text-xl">{cat.emoji}</div>
                                            </div>
                                            <div>
                                                <div className={`text-sm font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>{cat.label}</div>
                                                <div className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{items.length} tasks</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                className={`text-xs px-2 py-1 ${BORDER}`}
                                                style={{
                                                    background: darkMode ? "#052b1f" : "#ecfdf5",
                                                    color: darkMode ? "#5eead4" : "#065f46",
                                                }}
                                            >
                                                New
                                            </button>
                                        </div>
                                    </div>

                                    <ul className="space-y-3">
                                        {items.length === 0 && <li className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-400"}`}>Empty</li>}
                                        {items.map((todo) => (
                                            <li
                                                key={todo.id}
                                                className={`${BORDER} flex items-start gap-3 p-3`}
                                                style={{
                                                    borderLeft: `5px solid ${todo.color ?? "#ff8fa3"}`,
                                                    background: darkMode ? "#041316" : "#fff",
                                                    boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.45)" : "0 1px 6px rgba(15,23,42,0.06)",
                                                }}
                                            >
                                                <input type="checkbox" checked={todo.done} onChange={() => toggleDone(todo.id)} className="mt-1 h-4 w-4" />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={todo.done ? "line-through text-slate-400" : `${darkMode ? "text-slate-100" : "text-slate-900"} font-medium`}>{todo.text}</div>
                                                            <div className={`text-xs px-2 py-0.5 rounded-full text-white ${priorityStyle(todo.priority)}`}>{todo.priority}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {todo.date && <div className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-500"}`}>📅 {formatDisplayDate(todo.date)}</div>}
                                                            {todo.time && <div className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-500"}`}>⏰ {todo.time}</div>}
                                                            <button onClick={() => removeTodo(todo.id)} className="text-xs text-pink-600 hover:underline">Delete</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </section>

                    <footer className={`mt-8 text-center text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                        Made by Nikol
                    </footer>
                </main>
            </div>
        </div>
    );
}
