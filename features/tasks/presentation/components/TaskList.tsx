"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@clerk/react";
import { useTasks, type TaskData } from "../../infrastructure/useTasks";
import type { Id } from "@/convex/_generated/dataModel";
import dayjs from "dayjs";

export function TaskList() {
  const { userId } = useAuth();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  
  const { 
    incompleteTasks, 
    completedTasks, 
    overdueTasks,
    dueSoonTasks,
    createTask, 
    toggleComplete, 
    deleteTask,
    isDecrypting 
  } = useTasks(userId || undefined);

  const handleAddTask = useCallback(async () => {
    if (!newTaskTitle.trim() || !userId) return;
    
    await createTask({
      userId,
      title: newTaskTitle.trim(),
      completed: false,
    });
    
    setNewTaskTitle("");
  }, [newTaskTitle, userId, createTask]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTask();
    }
  };

  const handleToggle = useCallback((taskId: Id<"tasks">) => {
    toggleComplete(taskId);
  }, [toggleComplete]);

  const handleDelete = useCallback((taskId: Id<"tasks">) => {
    deleteTask(taskId);
  }, [deleteTask]);

  const formatDueDate = (timestamp?: number) => {
    if (!timestamp) return null;
    const date = dayjs(timestamp);
    const now = dayjs();
    
    if (date.isBefore(now, "day")) {
      return { text: "Overdue", className: "text-red-500" };
    }
    if (date.isSame(now, "day")) {
      return { text: "Today", className: "text-orange-500" };
    }
    if (date.isSame(now.add(1, "day"), "day")) {
      return { text: "Tomorrow", className: "text-yellow-500" };
    }
    return { text: date.format("MMM D"), className: "text-gray-500" };
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Tasks</h2>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a task..."
            className="flex-1 px-3 py-2 border rounded-md bg-background text-sm"
          />
          <button
            onClick={handleAddTask}
            disabled={!newTaskTitle.trim()}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isDecrypting && !incompleteTasks.length ? (
          <div className="text-center text-muted-foreground py-4">
            Loading tasks...
          </div>
        ) : (
          <>
            {overdueTasks.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-red-500 mb-2">Overdue</h3>
                <TaskItems 
                  tasks={overdueTasks} 
                  onToggle={handleToggle} 
                  onDelete={handleDelete}
                  formatDueDate={formatDueDate}
                />
              </div>
            )}

            {dueSoonTasks.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-yellow-500 mb-2">Due Soon</h3>
                <TaskItems 
                  tasks={dueSoonTasks} 
                  onToggle={handleToggle} 
                  onDelete={handleDelete}
                  formatDueDate={formatDueDate}
                />
              </div>
            )}

            {incompleteTasks.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">To Do</h3>
                <TaskItems 
                  tasks={incompleteTasks} 
                  onToggle={handleToggle} 
                  onDelete={handleDelete}
                  formatDueDate={formatDueDate}
                />
              </div>
            )}

            {showCompleted && completedTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Completed</h3>
                <TaskItems 
                  tasks={completedTasks} 
                  onToggle={handleToggle} 
                  onDelete={handleDelete}
                  formatDueDate={formatDueDate}
                />
              </div>
            )}

            {!showCompleted && completedTasks.length > 0 && (
              <button
                onClick={() => setShowCompleted(true)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Show {completedTasks.length} completed tasks
              </button>
            )}

            {incompleteTasks.length === 0 && completedTasks.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No tasks yet. Add one above!
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface TaskItemsProps {
  tasks: TaskData[];
  onToggle: (taskId: Id<"tasks">) => void;
  onDelete: (taskId: Id<"tasks">) => void;
  formatDueDate: (timestamp?: number) => { text: string; className: string } | null;
}

function TaskItems({ tasks, onToggle, onDelete, formatDueDate }: TaskItemsProps) {
  return (
    <ul className="space-y-2">
      {tasks.map((task) => {
        const dueInfo = formatDueDate(task.dueDate);
        
        return (
          <li 
            key={task._id} 
            className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 group"
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggle(task._id!)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className={`flex-1 ${task.completed ? "line-through text-muted-foreground" : ""}`}>
              {task.title}
            </span>
            {dueInfo && !task.completed && (
              <span className={`text-xs ${dueInfo.className}`}>
                {dueInfo.text}
              </span>
            )}
            <button
              onClick={() => onDelete(task._id!)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500"
            >
              ×
            </button>
          </li>
        );
      })}
    </ul>
  );
}
