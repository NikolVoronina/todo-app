"use client";

import React, { useEffect, useState } from "react";

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

export default function Home() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [text, setText] = useState("");
    const [priority, setPriority] = useState<Priority>("medium");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [color, setColor] = useState("#ff8fa3");
    const [category, setCategory] = useState<string>("inbox");

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

    return (
        <div style={{ fontFamily: "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }} className="min-h-screen bg-gradient-to-b from-pink-50 to-emerald-50 flex items-start justify-center py-12 px-4">
            {/* load font */}
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');`}</style>

            <div className="w-full max-w-6xl">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-400 to-emerald-300 flex items-center justify-center shadow-md">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                                <path d="M4 7h16M4 12h10M4 17h16" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900">Tasks & Planner</h1>
                            <p className="text-sm text-slate-600 mt-0.5">Превосходный дизайн: розовые и зелёные акценты, иконки и колонки для разделов</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-700">{todos.length} total</div>
                        <button onClick={clearCompleted} className="px-3 py-2 text-sm rounded-md bg-pink-50 border border-pink-200 text-pink-700 hover:bg-pink-100">
                            Clear completed
                        </button>
                    </div>
                </header>

                <main className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6">
                    <form onSubmit={addTodo} className="grid grid-cols-1 md:grid-cols-8 gap-3 items-end mb-6">
                        <div className="md:col-span-4">
                            <label className="block text-xs font-medium text-slate-600 mb-1">Task</label>
                            <input
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Например: подготовить отчёт"
                                className="w-full px-4 py-3 border border-pink-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-200 text-slate-800"
                            />
                        </div>

                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as Priority)}
                                className="w-full px-3 py-2 border border-pink-100 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-emerald-100"
                            >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>

                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-pink-100 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-emerald-100"
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2 flex gap-3">
                            <div className="flex-1 relative">
                                <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                                <div className="relative">
                                    <svg className="absolute left-3 top-3 w-5 h-5 text-pink-400" viewBox="0 0 24 24" fill="none">
                                        <path d="M7 11h10M7 16h6M8 7V5M16 7V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                        <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
                                    </svg>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-pink-100 rounded-lg focus:ring-2 focus:ring-pink-200"
                                    />
                                </div>
                                <div className="mt-1 text-xs text-slate-500">Календарь встроенный (выберите дату)</div>
                            </div>

                            <div className="w-36">
                                <label className="block text-xs font-medium text-slate-600 mb-1">Time</label>
                                <input
                                    type="time"
                                    step={1800}
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-pink-100 rounded-lg focus:ring-2 focus:ring-emerald-100"
                                />
                                <div className="mt-1 text-xs text-slate-500">Каждые 30 минут</div>
                            </div>
                        </div>

                        <div className="md:col-span-8 flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-medium text-slate-600">Color</label>
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-10 h-10 p-0 border rounded-md"
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
                                    className="px-4 py-2 text-sm rounded-md border border-pink-100 text-slate-700 hover:bg-pink-50"
                                >
                                    Reset
                                </button>

                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-gradient-to-br from-pink-500 to-emerald-400 text-white rounded-md shadow-md hover:opacity-95 flex items-center gap-2"
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
                                <div key={cat.id} className="bg-gradient-to-b from-white to-pink-25 rounded-2xl p-4 shadow-md border border-pink-50" style={{ minHeight: 140 }}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center shadow-inner" style={{ border: "1px solid rgba(0,0,0,0.03)" }}>
                                                <div className="text-xl">{cat.emoji}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-slate-800">{cat.label}</div>
                                                <div className="text-xs text-slate-500">{items.length} tasks</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button className="text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-700">New</button>
                                        </div>
                                    </div>

                                    <ul className="space-y-3">
                                        {items.length === 0 && <li className="text-xs text-slate-400">Пусто</li>}
                                        {items.map((todo) => (
                                            <li key={todo.id} className="flex items-start gap-3 bg-white rounded-xl p-3 shadow-sm" style={{ borderLeft: `5px solid ${todo.color ?? "#ff8fa3"}` }}>
                                                <input type="checkbox" checked={todo.done} onChange={() => toggleDone(todo.id)} className="mt-1 h-4 w-4 text-rose-500" />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={todo.done ? "line-through text-slate-400" : "text-slate-900 font-medium"}>{todo.text}</div>
                                                            <div className={`text-xs px-2 py-0.5 rounded-full text-white ${priorityStyle(todo.priority)}`}>{todo.priority}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {todo.date && <div className="text-xs text-slate-500">📅 {todo.date}</div>}
                                                            {todo.time && <div className="text-xs text-slate-500">⏰ {todo.time}</div>}
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
                </main>
            </div>
        </div>
    );
}
