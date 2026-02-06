// electron/db.ts
import { app, ipcMain } from 'electron';
import { JSONFilePreset } from 'lowdb/node';
import path from 'path';

// Define types here locally to avoid importing from src which might cause issues in electron build
type TaskType = 'study' | 'life' | 'habit';
type TaskStatus = 'todo' | 'in_progress' | 'done';

interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  dueDate: string;
  isDailyPlan: boolean;
  planDate?: string;
  createdAt: string;
}

interface Habit {
  id: string;
  name: string;
  targetValue: number;
  unit: string;
  icon?: string;
}

interface HabitLog {
  [habitId: string]: number;
}

interface FocusLog {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  tag: string;
  content?: string;
}

interface DailyJournal {
  date: string;
  lifeLog: string;
  tomorrowPlan: string;
}

interface DBData {
  tasks: Task[];
  habits: Habit[];
  habitLogs: { [date: string]: HabitLog };
  focusLogs: FocusLog[];
  journals: { [date: string]: DailyJournal };
}

const defaultData: DBData = {
  tasks: [],
  habits: [
    { id: '1', name: '早起', targetValue: 1, unit: '次', icon: 'Sun' },
    { id: '2', name: '运动', targetValue: 30, unit: '分钟', icon: 'Run' },
    { id: '3', name: '阅读', targetValue: 30, unit: '分钟', icon: 'Book' },
  ],
  habitLogs: {},
  focusLogs: [],
  journals: {},
};

let db: any;

export const setupDB = async () => {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'db.json');
  console.log('Database path:', dbPath);

  db = await JSONFilePreset<DBData>(dbPath, defaultData);

  // Setup IPC handlers
  ipcMain.handle('db:read', () => {
    return db.data;
  });

  ipcMain.handle('db:write', async (_, data: Partial<DBData>) => {
    db.data = { ...db.data, ...data };
    await db.write();
    return db.data;
  });

  ipcMain.handle('db:update', async (_, key: keyof DBData, value: any) => {
    console.log(`[DB Update] Key: ${key}, Incoming value length: ${Array.isArray(value) ? value.length : 'N/A'}`);

    // Direct assignment instead of spread to ensure reference is updated correctly by lowdb
    (db.data as any)[key] = value;

    console.log(`[DB Update] Data in memory BEFORE write. Tasks count: ${db.data.tasks?.length}`);

    await db.write();

    console.log(`[DB Update] Data in memory AFTER write. Tasks count: ${db.data.tasks?.length}`);

    // Return a deep copy to avoid any reference issues
    return JSON.parse(JSON.stringify(db.data));
  });

  // Specific handlers for granular updates can be added here
};
