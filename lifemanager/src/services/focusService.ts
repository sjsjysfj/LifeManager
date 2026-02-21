import { v4 as uuidv4 } from 'uuid';
import { getDB, updateDB } from './db';
import type { FocusLog } from '../types';

export const addSupplementaryRecord = async (log: Omit<FocusLog, 'id'>): Promise<void> => {
  const newLog: FocusLog = {
    ...log,
    id: uuidv4(),
  };

  const dbData = await getDB();
  const updatedLogs = [...dbData.focusLogs, newLog];
  await updateDB('focusLogs', updatedLogs);
};
