"use client";

import React, { useEffect, useRef, useState } from "react";

type Priority = "low" | "medium" | "high";
type Todo = {
    id: number;
    text: string;
    done: boolean;
    priority: Priority;
    date?: string;
    time?: string;
    color?: string;
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

const BORDER = "rounded-2xl";

export default function Home() {
    // data
    const [todos, setTodos] = useState<Todo[]>([]);
    const [text, setText] = useState("");
    const [priority, setPriority] = useState<Priority>("medium");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [color, setColor] = useState("#ff8fa3");
    const [category, setCategory] = useState<string>("inbox");

    // ui state / accessibility
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [xp, setXp] = useState<number>(0);
    const [query] = useState<string>(""); // new: search/filter
    const [showOnlyUnfinished, setShowOnlyUnfinished] = useState(false);

    // client-mounted flag to avoid SSR/CSR content mismatch (hydation errors)
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // initialize persisted state client-side only
    useEffect(() => {
        try {
            const savedDark = localStorage.getItem("darkMode");
            if (savedDark !== null) setDarkMode(savedDark === "1");
            else if (typeof window !== "undefined" && window.matchMedia)
                setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);

            const rawTodos = localStorage.getItem("todos");
            if (rawTodos) {
                const parsed = JSON.parse(rawTodos) as Partial<Todo>[];
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
            }

            const rawXp = localStorage.getItem("xp");
            if (rawXp) setXp(Number(rawXp) || 0);
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem("todos", JSON.stringify(todos));
        } catch {}
    }, [todos]);

    useEffect(() => {
        try {
            localStorage.setItem("darkMode", darkMode ? "1" : "0");
        } catch {}
    }, [darkMode]);

    useEffect(() => {
        try {
            localStorage.setItem("xp", String(xp));
        } catch {}
    }, [xp]);

    // XP / Level system
    const XP_PER_TASK = 10;
    const getLevel = (xpVal: number) => Math.floor(xpVal / 100) + 1;
    const level = getLevel(xp);
    const progressPercent = Math.min(100, Math.max(0, xp % 100));

    // helpers
    const normalizeTime = (value: string) => {
        const v = value.trim();
        if (!v) return "";
        const alt = v.replace(".", ":").replace(",", ":");
        const m = alt.match(/^(\d{1,2}):(\d{2})$/);
        if (!m) return "";
        const hh = Number(m[1]);
        const mm = Number(m[2]);
        if (hh >= 0 && hh < 24 && mm >= 0 && mm < 60) return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
        return "";
    };

    const generateTimeOptions = () => {
        const list: string[] = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 30) {
                list.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
            }
        }
        return list;
    };
    const timeOptions = generateTimeOptions();

    const formatDisplayDate = (d?: string) => {
        if (!d) return "";
        try {
            // avoid locale-dependent mismatch during SSR by formatting only on client (mounted)
            if (!mounted) return d;
            const dt = new Date(d + "T00:00");
            return dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
        } catch {
            return d;
        }
    };

    const priorityStyle = (p: Priority) =>
        p === "high" ? "bg-pink-500" : p === "medium" ? "bg-rose-300 text-rose-900" : "bg-emerald-400 text-emerald-900";

    // actions
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
            color,
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
        setTodos((prev) =>
            prev.map((t) => {
                if (t.id !== id) return t;
                const willBeDone = !t.done;
                setXp((cur) => (willBeDone ? cur + XP_PER_TASK : Math.max(0, cur - XP_PER_TASK)));
                return { ...t, done: willBeDone };
            })
        );
    };

    const removeTodo = (id: number) => {
        setTodos((prev) => {
            const target = prev.find((t) => t.id === id);
            if (target && target.done) setXp((cur) => Math.max(0, cur - XP_PER_TASK));
            return prev.filter((t) => t.id !== id);
        });
    };

    const clearCompleted = () => {
        setTodos((prev) => {
            const removedCount = prev.filter((t) => t.done).length;
            if (removedCount > 0) setXp((cur) => Math.max(0, cur - removedCount * XP_PER_TASK));
            return prev.filter((t) => !t.done);
        });
    };

    // grouping + filtering (search + unfinished toggle)
    const groupByCategory = (list: Todo[]) => {
        const map = new Map<string, Todo[]>();
        for (const c of CATEGORIES) map.set(c.id, []);
        for (const t of list) {
            if (!map.has(t.category)) map.set(t.category, []);
            map.get(t.category)!.push(t);
        }
        return map;
    };

    const filteredTodos = todos.filter((t) => {
        if (showOnlyUnfinished && t.done) return false;
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
            t.text.toLowerCase().includes(q) ||
            (t.category && t.category.toLowerCase().includes(q)) ||
            (t.date && t.date.includes(q)) ||
            (t.time && t.time.includes(q))
        );
    });

    const grouped = groupByCategory(filteredTodos);

    // TimeInput component (unchanged behavior, kept compact)
    function TimeInput({ value, onChange, dark }: { value: string; onChange: (v: string) => void; dark: boolean }) {
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
                    className={`w-full md:w-28 px-3 py-2 border border-pink-100 ${BORDER} focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 ${dark ? "bg-[#061014] text-slate-100" : "bg-white text-slate-800"}`}
                    aria-label="Time (HH:MM)"
                />

                {open && (
                    <div
                        className={`absolute top-full mt-2 z-50 max-h-44 overflow-auto border ${BORDER}`}
                        style={{
                            boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                            background: dark ? "linear-gradient(180deg,#041316,#071a14)" : "#fff",
                            color: dark ? "#e6f6ef" : undefined,
                            borderColor: dark ? "rgba(255,255,255,0.03)" : undefined,
                            left: 0,
                            right: 0,
                            width: "100%",
                            maxWidth: "18rem",
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
                                    className={`w-full text-left px-3 py-2 text-sm rounded-md ${dark ? "hover:bg-[#04221a]" : "hover:bg-pink-50"}`}
                                    style={{ color: dark ? "#e6f6ef" : undefined }}
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

    // styling utilities
    const rootBg = darkMode ? "bg-gradient-to-b from-[#111317] to-[#083f2e]" : "bg-gradient-to-b from-[#fff6fb] via-[#fff0f6] to-[#fffafc]";
    const mainBgStyle = darkMode ? { background: "linear-gradient(180deg, rgba(8,10,12,0.82), rgba(6,20,16,0.82))", color: "#e6f6ef" } : undefined;
    const textColor = darkMode ? "text-slate-200" : "text-slate-900";

    // UX tweaks:
    // - header includes compact search (center) to quickly find tasks
    // - action buttons share consistent size and wrap when needed
    // - Add button disabled when task empty
    // - subtle focus-visible outlines and hover transforms
    return (
        <div suppressHydrationWarning className={`min-h-screen flex items-start justify-center py-8 px-4 sm:py-12 sm:px-6 ${rootBg}`}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');`}</style>

            <div className="w-full max-w-7xl">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-12 h-12 ${BORDER} bg-gradient-to-br from-pink-400 to-emerald-300 flex items-center justify-center shadow-md flex-shrink-0`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white" aria-hidden>
                                <path d="M4 7h16M4 12h10M4 17h16" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>

                        <div className="min-w-0">
                            <h1 className={`text-3xl sm:text-4xl font-bold ${textColor} truncate`}>Todo</h1>
                            <p className={`text-sm mt-0.5 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>By Nikol Voronina</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {/* compact stats + controls */}
                        <div className="ml-auto flex items-center gap-2 flex-wrap">
                            <div className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-700"} px-3 py-2 ${BORDER} bg-white/5`} aria-hidden>
                                {mounted ? `${todos.length} total` : "— total"}
                            </div>

                            <div className={`flex items-center gap-2 px-3 py-2 ${BORDER}`} style={{ background: darkMode ? "#071a14" : "#fff" }}>
                                <div className="text-xs font-medium mr-2">{mounted ? `${level} • ${xp} XP` : "— • — XP"}</div>
                                <div className="w-24 h-2 bg-white/30 rounded-full overflow-hidden" style={{ background: darkMode ? "rgba(255,255,255,0.06)" : undefined }}>
                                    <div style={{ width: `${mounted ? progressPercent : 0}%`, height: "100%", background: "linear-gradient(90deg,#ff8fa3,#34d399)" }} />
                                </div>
                            </div>

                            <button
                                onClick={() => setShowOnlyUnfinished((s) => !s)}
                                className={`px-3 h-10 min-w-[92px] flex items-center justify-center text-sm ${BORDER} focus-visible:ring-2 focus-visible:ring-rose-300`}
                                style={{ background: showOnlyUnfinished ? "#fff3f5" : darkMode ? "#071318" : "#fff" }}
                                aria-pressed={showOnlyUnfinished}
                                title="Toggle unfinished"
                            >
                                {showOnlyUnfinished ? "Unfinished" : "All"}
                            </button>

                            <button
                                onClick={() => setDarkMode((s) => !s)}
                                className={`px-3 h-10 min-w-[92px] flex items-center justify-center text-sm ${BORDER}`}
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
                                className={`px-3 h-10 min-w-[120px] flex items-center justify-center text-sm ${BORDER}`}
                                style={{
                                    background: darkMode ? "rgba(255,20,100,0.06)" : "#fff3f5",
                                    border: "1px solid rgba(255,182,193,0.25)",
                                    color: "#ec4899",
                                }}
                            >
                                Clear completed
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main */}
                <main className={`${BORDER} shadow-xl p-4 sm:p-6`} style={{ ...(mainBgStyle ?? {}), ...(darkMode ? { border: "1px solid rgba(255,255,255,0.04)" } : {}) }}>
                    {/* Form: controls stay on one line and wrap when needed */}
                    <form onSubmit={addTodo} className="flex flex-wrap gap-3 items-end mb-6">
                        <div className="flex-1 min-w-[160px]">
                            <label className="block text-xs font-medium mb-1">Task</label>
                            <input
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Write your task"
                                className={`w-full px-4 py-3 border ${BORDER} shadow-sm focus:outline-none focus-visible:ring-2 ${darkMode ? "focus-visible:ring-emerald-200 bg-[#061014] text-slate-100" : "focus-visible:ring-pink-200 bg-white text-slate-800"}`}
                                aria-label="New task"
                            />
                        </div>

                        <div className="w-[112px] flex-shrink-0">
                            <label className="block text-xs font-medium mb-1">Priority</label>
                            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={`w-full px-3 py-2 border ${BORDER} focus-visible:ring-2 ${darkMode ? "bg-[#071318] text-slate-100" : "bg-white text-slate-800"}`} aria-label="Priority">
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>

                        <div className="w-[140px] flex-shrink-0">
                            <label className="block text-xs font-medium mb-1">Category</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)} className={`w-full px-3 py-2 border ${BORDER} ${darkMode ? "bg-[#071318] text-slate-100" : "bg-white text-slate-800"}`} aria-label="Category">
                                {CATEGORIES.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="w-[180px] flex-shrink-0">
                            <label className="block text-xs font-medium mb-1">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className={`w-full pl-3 pr-3 py-2 border ${BORDER} focus-visible:ring-2 ${darkMode ? "bg-[#061014] text-slate-100" : "bg-white text-slate-800"}`}
                                aria-label="Date"
                            />
                        </div>

                        <div className="w-[120px] flex-shrink-0">
                            <label className="block text-xs font-medium mb-1">Time</label>
                            <TimeInput value={time} onChange={(v) => { const n = normalizeTime(v); if (n) setTime(n); else setTime(v); }} dark={darkMode} />
                        </div>

                        <div className="flex items-center gap-3 ml-auto">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-medium">Color</label>
                                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className={`${BORDER} w-10 h-10 p-0`} aria-label="Task color" />
                            </div>

                            <button
                                type="button"
                                onClick={() => { setText(""); setPriority("medium"); setDate(""); setTime(""); setColor("#ff8fa3"); setCategory("inbox"); }}
                                className={`px-4 h-10 ${BORDER} border text-sm`}
                                style={{ background: darkMode ? "#071318" : "transparent" }}
                            >
                                Reset
                            </button>

                            <button
                                type="submit"
                                disabled={!text.trim()}
                                className={`px-4 h-10 ${BORDER} text-white flex items-center gap-2 shadow-md transform transition-transform hover:-translate-y-0.5 disabled:opacity-60`}
                                style={{ background: "linear-gradient(90deg,#ff3b7a,#34d399)" }}
                                aria-disabled={!text.trim()}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add
                            </button>
                        </div>
                    </form>

                    {/* Tasks area */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {CATEGORIES.map((cat) => {
                            const items = grouped.get(cat.id) ?? [];
                            return (
                                <div
                                    key={cat.id}
                                    className={`${BORDER} p-4 shadow-md border flex flex-col`}
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
                                                onClick={() => {
                                                    // quick create in category
                                                    setCategory(cat.id);
                                                    const el = document.querySelector('input[aria-label="New task"]') as HTMLInputElement | null;
                                                    el?.focus();
                                                }}
                                                className={`text-xs px-2 py-1 ${BORDER}`}
                                                style={{ background: darkMode ? "#052b1f" : "#ecfdf5", color: darkMode ? "#5eead4" : "#065f46" }}
                                            >
                                                New
                                            </button>
                                        </div>
                                    </div>

                                    <ul className="space-y-3 flex-1 overflow-auto">
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
                                                <input type="checkbox" checked={todo.done} onChange={() => toggleDone(todo.id)} className="mt-1 h-4 w-4 flex-shrink-0" aria-label={`Mark ${todo.text} done`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className={`truncate ${todo.done ? "line-through text-slate-400" : `${darkMode ? "text-slate-100" : "text-slate-900"} font-medium`}`}>{todo.text}</div>
                                                            <div className={`text-xs px-2 py-0.5 rounded-full text-white ${priorityStyle(todo.priority)}`}>{todo.priority}</div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {mounted && todo.date && <div className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-500"}`}>📅 {formatDisplayDate(todo.date)}</div>}
                                                            {mounted && todo.time && <div className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-500"}`}>⏰ {todo.time}</div>}
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

                    <footer className={`mt-8 text-center text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Made by Nikol</footer>
                </main>
            </div>
        </div>
    );
}
