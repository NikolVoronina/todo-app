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
        p === "high" ? "bg-red-500" : p === "medium" ? "bg-yellow-400" : "bg-green-500";

    const grouped = groupByCategory(todos);

    return (
        <div className="min-h-screen flex items-start justify-center p-8 bg-slate-50">
            <div className="w-full max-w-3xl">
                <h1 className="text-3xl font-extrabold mb-6">Todo App</h1>

                <form onSubmit={addTodo} className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-6 items-end">
                    <div className="md:col-span-3">
                        <label className="block text-sm text-gray-600 mb-1">Task</label>
                        <input
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Add new task..."
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Priority</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as Priority)}
                            className="w-full px-2 py-2 border rounded"
                        >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-2 py-2 border rounded"
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2 flex gap-2">
                        <div className="flex-1">
                            <label className="block text-sm text-gray-600 mb-1">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-2 py-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Time</label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full px-2 py-2 border rounded"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-6 flex items-center gap-2">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Color</label>
                            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 p-0 border rounded" />
                        </div>
                        <div className="ml-auto">
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                                Add
                            </button>
                        </div>
                    </div>
                </form>

                <div className="mb-4 flex justify-between items-center text-sm text-gray-600">
                    <div>{todos.length} items</div>
                    <div className="flex items-center gap-4">
                        <button onClick={clearCompleted} className="text-red-600">
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
                                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <span className="text-xl">{cat.emoji}</span>
                                    {cat.label}
                                </h2>

                                <ul className="space-y-2">
                                    {items.map((todo) => (
                                        <li
                                            key={todo.id}
                                            className="flex items-center justify-between p-3 rounded shadow-sm bg-white"
                                            style={{ borderLeft: `4px solid ${todo.color ?? "#60a5fa"}` }}
                                        >
                                            <label className="flex items-start gap-3 flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={todo.done}
                                                    onChange={() => toggleDone(todo.id)}
                                                    className="mt-1"
                                                />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={todo.done ? "line-through text-gray-500" : "font-medium"}>
                                                            {todo.text}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded text-xs text-white ${priorityColor(todo.priority)}`}>
                                                            {todo.priority}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1 flex gap-3 items-center">
                                                        {todo.date && <span>📅 {todo.date}</span>}
                                                        {todo.time && <span>⏰ {todo.time}</span>}
                                                    </div>
                                                </div>
                                            </label>

                                            <div className="flex items-center gap-3">
                                                <div className="text-sm text-gray-600">{CATEGORIES.find((c) => c.id === todo.category)?.emoji}</div>
                                                <button onClick={() => removeTodo(todo.id)} className="text-red-500 text-sm">
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
            </div>
        </div>
    );
}
