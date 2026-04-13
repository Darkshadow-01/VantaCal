"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { encryptData, decryptData, hasMasterKey, type EncryptedPayload } from "@/lib/e2ee";

export interface TaskData {
  _id?: Id<"tasks">;
  _creationTime?: number;
  userId: string;
  workspaceId?: Id<"workspaces">;
  title: string;
  description?: string;
  dueDate?: number;
  completed: boolean;
  priority?: "low" | "medium" | "high";
  eventId?: Id<"events">;
  createdAt?: number;
  updatedAt?: number;
}

interface EncryptedTaskDoc {
  _id: Id<"tasks">;
  _creationTime: number;
  userId: string;
  workspaceId?: Id<"workspaces">;
  eventId?: Id<"events">;
  encryptedPayload: string;
  completed: boolean;
  dueDate?: number;
  createdAt: number;
  updatedAt: number;
}

export function useTasks(userId?: string | null) {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const encryptedTasks = useQuery(api.tasks.index.getTasks, userId ? { userId } : "skip");
  const createTaskMutation = useMutation(api.tasks.index.createTask);
  const updateTaskMutation = useMutation(api.tasks.index.updateTask);
  const deleteTaskMutation = useMutation(api.tasks.index.deleteTask);

  const decryptTask = useCallback(async (encrypted: EncryptedTaskDoc): Promise<TaskData | null> => {
    if (!hasMasterKey()) {
      return null;
    }
    try {
      const payload: EncryptedPayload = JSON.parse(encrypted.encryptedPayload);
      const decrypted = await decryptData<TaskData>(payload);
      return {
        ...decrypted,
        _id: encrypted._id,
        _creationTime: encrypted._creationTime,
        completed: encrypted.completed,
        dueDate: encrypted.dueDate,
        createdAt: encrypted.createdAt,
        updatedAt: encrypted.updatedAt,
      };
    } catch (err) {
      console.error("Failed to decrypt task:", encrypted._id, err);
      return null;
    }
  }, []);

  const decryptAllTasks = useCallback(async () => {
    if (!encryptedTasks || !hasMasterKey()) {
      setTasks([]);
      return;
    }

    setIsDecrypting(true);
    try {
      const decryptedTasks: TaskData[] = [];
      for (const task of encryptedTasks) {
        const decrypted = await decryptTask(task);
        if (decrypted) {
          decryptedTasks.push(decrypted);
        }
      }
      setTasks(decryptedTasks);
    } catch (err) {
      console.error("Failed to decrypt tasks:", err);
    } finally {
      setIsDecrypting(false);
    }
  }, [encryptedTasks, decryptTask]);

  useEffect(() => {
    decryptAllTasks();
  }, [encryptedTasks, decryptAllTasks]);

  const createTask = useCallback(async (taskData: Omit<TaskData, "_id" | "_creationTime" | "createdAt" | "updatedAt">) => {
    if (!hasMasterKey()) {
      throw new Error("Encryption key not available");
    }

    const encrypted = await encryptData(taskData);
    
    return createTaskMutation({
      userId: taskData.userId,
      workspaceId: taskData.workspaceId,
      eventId: taskData.eventId,
      encryptedPayload: JSON.stringify(encrypted),
      completed: taskData.completed,
      dueDate: taskData.dueDate,
    });
  }, [createTaskMutation]);

  const updateTask = useCallback(async (taskId: Id<"tasks">, updates: Partial<TaskData>) => {
    if (!hasMasterKey()) {
      throw new Error("Encryption key not available");
    }

    const updateData: {
      completed?: boolean;
      dueDate?: number;
      encryptedPayload?: string;
    } = {};

    if (updates.completed !== undefined) updateData.completed = updates.completed;
    if (updates.dueDate !== undefined) updateData.dueDate = updates.dueDate;
    
    if (updates.title || updates.description || updates.priority) {
      const existing = tasks.find(t => t._id === taskId);
      if (existing) {
        const toEncrypt = {
          title: updates.title ?? existing.title,
          description: updates.description ?? existing.description,
          priority: updates.priority ?? existing.priority,
          userId: existing.userId,
          completed: existing.completed,
        };
        const encrypted = await encryptData(toEncrypt);
        updateData.encryptedPayload = JSON.stringify(encrypted);
      }
    }

    return updateTaskMutation({ taskId, ...updateData });
  }, [updateTaskMutation, tasks]);

  const toggleComplete = useCallback(async (taskId: Id<"tasks">) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;
    
    await updateTask(taskId, { completed: !task.completed });
  }, [tasks, updateTask]);

  const deleteTask = useCallback(async (taskId: Id<"tasks">) => {
    await deleteTaskMutation({ taskId });
  }, [deleteTaskMutation]);

  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < Date.now());
  const dueSoonTasks = tasks.filter(t => !t.completed && t.dueDate && t.dueDate > Date.now() && t.dueDate < Date.now() + 7 * 24 * 60 * 60 * 1000);

  return {
    tasks,
    incompleteTasks,
    completedTasks,
    overdueTasks,
    dueSoonTasks,
    isDecrypting,
    createTask,
    updateTask,
    toggleComplete,
    deleteTask,
    refresh: decryptAllTasks,
  };
}
