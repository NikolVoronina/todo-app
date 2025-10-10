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
    const [color, setColor] = useState("#60a5fa");
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
                    color: t.color ?? "#60a5fa",
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
            color: color || "#60a5fa",
            category,
        };
        setTodos((prev) => [newTodo, ...prev]);
        setText("");
        setPriority("medium");
        setDate("");
        setTime("");
        setColor("#60a5fa");
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

    const priorityColor = (p: Priority) =>
        p === "high" ? "bg-red-500" : p === "medium" ? "bg-yellow-400" : "bg-emerald-500";

    const grouped = groupByCategory(todos);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-start justify-center py-12 px-4">
            <div className="w-full max-w-4xl">
                <header className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">My Tasks</h1>
                        <p className="text-sm text-slate-500 mt-1">Управляйте задачами: приоритет, дата, время, цвет и категории</p>
                    </div>
                    <div className="text-sm text-slate-600">{todos.length} tasks</div>
                </header>

                <main className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6">
                    <form onSubmit={addTodo} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end mb-6">
                        <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-slate-600 mb-1">Task</label>
                            <input
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="What do you want to do?"
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300 text-slate-800"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as Priority)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-sky-200"
                            >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-sky-200"
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2 flex gap-3">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-200"
                                />
                            </div>
                            <div className="w-36">
                                <label className="block text-xs font-medium text-slate-600 mb-1">Time</label>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-200"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-6 flex items-center gap-3">
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
                                        setColor("#60a5fa");
                                        setCategory("inbox");
                                    }}
                                    className="px-4 py-2 text-sm rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                                >
                                    Reset
                                </button>

                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-sky-600 text-white rounded-md shadow-md hover:bg-sky-700 flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add task
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="mb-4 flex items-center justify-between">
                        <div className="text-sm text-slate-600">{todos.filter((t) => !t.done).length} open • {todos.filter((t) => t.done).length} done</div>
                        <div>
                            <button onClick={clearCompleted} className="text-sm text-rose-600 hover:underline">
                                Clear completed
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {Array.from(grouped.entries()).map(([catId, items]) => {
                            if (!items.length) return null;
                            const cat = CATEGORIES.find((c) => c.id === catId) ?? { label: catId, emoji: "🔖" };
                            return (
                                <section key={catId}>
                                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-3">
                                        <span className="text-2xl">{cat.emoji}</span>
                                        <span className="text-slate-800">{cat.label}</span>
                                        <span className="ml-2 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{items.length}</span>
                                    </h2>

                                    <ul className="grid gap-3">
                                        {items.map((todo) => (
                                            <li
                                                key={todo.id}
                                                className="flex items-center justify-between p-4 rounded-xl shadow-sm bg-white"
                                                style={{ borderLeft: `6px solid ${todo.color ?? "#60a5fa"}` }}
                                            >
                                                <label className="flex items-start gap-3 flex-1 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={todo.done}
                                                        onChange={() => toggleDone(todo.id)}
                                                        className="mt-1 h-4 w-4 text-sky-600"
                                                    />
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={todo.done ? "line-through text-slate-400 text-lg" : "text-slate-900 text-lg font-medium"}>
                                                                {todo.text}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs text-white ${priorityColor(todo.priority)}`}>
                                                                {todo.priority}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-1 flex gap-3 items-center">
                                                            {todo.date && <span className="flex items-center gap-1">📅 <span>{todo.date}</span></span>}
                                                            {todo.time && <span className="flex items-center gap-1">⏰ <span>{todo.time}</span></span>}
                                                        </div>
                                                    </div>
                                                </label>

                                                <div className="flex items-center gap-3">
                                                    <div className="text-lg">{CATEGORIES.find((c) => c.id === todo.category)?.emoji}</div>
                                                    <button
                                                        onClick={() => removeTodo(todo.id)}
                                                        className="text-sm text-rose-600 hover:underline"
                                                        aria-label="Delete task"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            );
                        })}
                    </div>
                </main>
            </div>
        </div>
    );
}
