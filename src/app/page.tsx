"use client";

import React, { useEffect, useState } from "react";

type Todo = {
    id: number;
    text: string;
    done: boolean;
};

export default function Home() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [text, setText] = useState("");

    useEffect(() => {
        const raw = localStorage.getItem("todos");
        if (raw) setTodos(JSON.parse(raw));
    }, []);

    useEffect(() => {
        localStorage.setItem("todos", JSON.stringify(todos));
    }, [todos]);

    const addTodo = (e?: React.FormEvent) => {
        e?.preventDefault();
        const value = text.trim();
        if (!value) return;
        setTodos((prev) => [{ id: Date.now(), text: value, done: false }, ...prev]);
        setText("");
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

    return (
        <div className="min-h-screen flex items-center justify-center p-8">
            <div className="w-full max-w-md">
                <h1 className="text-2xl font-bold mb-4">Todo App</h1>

                <form onSubmit={addTodo} className="flex gap-2 mb-4">
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Add new task..."
                        className="flex-1 px-3 py-2 border rounded"
                    />
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                        Add
                    </button>
                </form>

                <div className="mb-2 flex justify-between items-center text-sm text-gray-600">
                    <div>{todos.length} items</div>
                    <button onClick={clearCompleted} className="text-red-600">
                        Clear completed
                    </button>
                </div>

                <ul className="space-y-2">
                    {todos.map((todo) => (
                        <li
                            key={todo.id}
                            className="flex items-center justify-between bg-white/70 dark:bg-black/50 p-2 rounded"
                        >
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={todo.done} onChange={() => toggleDone(todo.id)} />
                                <span className={todo.done ? "line-through text-gray-500" : ""}>{todo.text}</span>
                            </label>
                            <button onClick={() => removeTodo(todo.id)} className="text-red-500">
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
