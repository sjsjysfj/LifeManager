import React, { useEffect, useState, useRef } from 'react';
import { Card, Col, Row, Typography, Checkbox, Progress, Button, List, message, Statistic } from 'antd';
import { SmileOutlined, CheckCircleOutlined, ClockCircleOutlined, ExportOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import html2canvas from 'html2canvas';
import { v4 as uuidv4 } from 'uuid';
import { getDB, updateDB } from '../services/db';
import type { DBData, DailyJournal, Habit, Task } from '../types';

dayjs.locale('zh-cn');

import MarkdownEditor from '../components/MarkdownEditor';

const { Title, Text } = Typography;
// const { TextArea } = Input; // Removed as we use MarkdownEditor


interface DailySummaryProps {
    onNavigate?: (key: string) => void;
}

const DailySummary: React.FC<DailySummaryProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DBData | null>(null);
  const [today] = useState(dayjs().format('YYYY-MM-DD'));

  // Refs for export
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Poll for data updates when window gains focus
  // Use a ref to track if we're currently processing to avoid race conditions
  const isProcessingRef = useRef(false);

  useEffect(() => {
      const handleFocus = () => {
          // Don't refresh if we're in the middle of processing
          if (isProcessingRef.current) return;
          fetchData();
      };
      window.addEventListener('focus', handleFocus);
      return () => {
          window.removeEventListener('focus', handleFocus);
      };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const dbData = await getDB();
      let updatedData = { ...dbData };
      let needsUpdate = false;

      // 1. Initialize today's journal if not exists
      if (!updatedData.journals[today]) {
        // Check for yesterday's "tomorrow plan"
        const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
        const yesterdayJournal = updatedData.journals[yesterday];

        if (yesterdayJournal?.tomorrowPlan) {
            // Split by newline and filter empty lines, remove markdown chars
            const lines = yesterdayJournal.tomorrowPlan
                .split(new RegExp('\r?\n'))
                .filter((line: string) => line.trim())
                .map((line: string) => line.replace(/^(\s*[-*+]|\s*\d+\.)\s+/, '').replace(/\[[ x]\]/i, '').trim()) // simple markdown list cleanup
                .filter((line: string) => line); // filter out empty lines after cleanup

            const newTasks: Task[] = lines.map(line => ({
                id: uuidv4(),
                title: line,
                type: 'life', // Default type
                status: 'todo',
                dueDate: today,
                isDailyPlan: true,
                planDate: today,
                createdAt: new Date().toISOString()
            }));

            updatedData.tasks = [...updatedData.tasks, ...newTasks];
            await updateDB('tasks', updatedData.tasks);
            message.info(`已将昨日计划的 ${newTasks.length} 项内容转为今日待办任务`);
        }

        const newJournal: DailyJournal = {
          date: today,
          lifeLog: '',
          tomorrowPlan: '',
        };
        updatedData.journals = { ...updatedData.journals, [today]: newJournal };
        needsUpdate = true;
      }

      // 2. Initialize today's habit log if not exists
      if (!updatedData.habitLogs[today]) {
         updatedData.habitLogs = { ...updatedData.habitLogs, [today]: {} };
         needsUpdate = true;
      }

      if (needsUpdate) {
         if (!dbData.journals[today]) await updateDB('journals', updatedData.journals);
         if (!dbData.habitLogs[today]) await updateDB('habitLogs', updatedData.habitLogs);
      }

      setData(updatedData);

    } catch (error) {
      console.error('Failed to fetch data:', error);
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLifeLogChange = async (val: string) => {
    if (!data) return;
    const updatedJournals = {
      ...data.journals,
      [today]: { ...data.journals[today], lifeLog: val }
    };
    setData({ ...data, journals: updatedJournals });
    await updateDB('journals', updatedJournals);
  };

  const handleTomorrowPlanChange = async (val: string) => {
    if (!data) return;
    const updatedJournals = {
      ...data.journals,
      [today]: { ...data.journals[today], tomorrowPlan: val }
    };
    setData({ ...data, journals: updatedJournals });
    await updateDB('journals', updatedJournals);
  };

  const handleHabitCheck = async (habitId: string) => {
    if (!data) return;
    const currentVal = data.habitLogs[today]?.[habitId] || 0;
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit) return;

    // Simple toggle logic for demo: 0 -> target -> 0
    const newVal = currentVal >= habit.targetValue ? 0 : habit.targetValue;

    const updatedHabitLogs = {
        ...data.habitLogs,
        [today]: { ...data.habitLogs[today], [habitId]: newVal }
    };

    setData({ ...data, habitLogs: updatedHabitLogs });
    await updateDB('habitLogs', updatedHabitLogs);
  };

  const handleTaskCheck = async (taskId: string, checked: boolean) => {
    if (!data) return;
    const updatedTasks = data.tasks.map(t =>
      t.id === taskId ? { ...t, status: checked ? 'done' : 'todo' } : t
    );
    // @ts-ignore
    setData({ ...data, tasks: updatedTasks });
    await updateDB('tasks', updatedTasks);
  };

  const handleExport = async () => {
    if (!pageRef.current) return;
    try {
      const canvas = await html2canvas(pageRef.current);
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `DailySummary-${today}.png`;
      link.href = url;
      link.click();
      message.success('导出成功！');
    } catch (err) {
      console.error(err);
      message.error('导出失败');
    }
  };

  if (loading || !data) {
    return <div>Loading...</div>;
  }

  // Derived Data
  const displayTasks = data.tasks.filter(t => {
      // Logic for displaying tasks in Daily Plan:
      // 1. Task is explicitly marked for today's plan (t.planDate === today)
      // 2. OR Task is due today (t.dueDate === today)
      // 3. OR Task is already completed today (implied by planDate if we track completion date, but for now we stick to plan/due date)
      return t.planDate === today || t.dueDate === today;
  });

  const todayFocusLogs = data.focusLogs.filter(l => l.date === today);
  const totalFocusTime = todayFocusLogs.reduce((acc, cur) => acc + cur.duration, 0);

  return (
    <div ref={pageRef} style={{ padding: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Title level={3}>{dayjs().format('YYYY年MM月DD日 dddd')}</Title>
        <Button icon={<ExportOutlined />} onClick={handleExport}>导出今日总结</Button>
      </div>

      <Row gutter={[16, 16]}>
        {/* Column 1: 今日学习 */}
        <Col span={5} xs={24} sm={12} md={8} lg={5}>
          <Card title={<><ClockCircleOutlined /> 今日学习</>} style={{ height: '100%' }}>
             <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <Statistic title="专注时长 (分钟)" value={totalFocusTime} suffix="min" />
             </div>
             <List
                size="small"
                dataSource={todayFocusLogs}
                renderItem={item => (
                    <List.Item>
                        <Text type="secondary">{item.startTime}</Text> {item.tag} ({item.duration}m)
                    </List.Item>
                )}
             />
             {todayFocusLogs.length === 0 && <Text type="secondary">今天还没有专注记录哦，加油！</Text>}
          </Card>
        </Col>

        {/* Column 2: 今日生活 */}
        <Col span={5} xs={24} sm={12} md={8} lg={5}>
          <Card title={<><SmileOutlined /> 今日生活</>} style={{ height: '100%' }} bodyStyle={{ padding: 0, overflow: 'hidden' }}>
            <MarkdownEditor
                value={data.journals[today]?.lifeLog || ''}
                onChange={(val) => handleLifeLogChange(val || '')}
                placeholder="记录今天发生的趣事、感悟..."
                height={500}
                preview="live"
            />
          </Card>
        </Col>

        {/* Column 3: 今日计划完成 */}
        <Col span={5} xs={24} sm={12} md={8} lg={5}>
          <Card title={<><CheckCircleOutlined /> 今日计划</>} style={{ height: '100%' }}>
             <List
                dataSource={displayTasks}
                renderItem={item => (
                    <List.Item>
                        <Checkbox
                            checked={item.status === 'done'}
                            onChange={e => handleTaskCheck(item.id, e.target.checked)}
                        >
                            <span style={{ textDecoration: item.status === 'done' ? 'line-through' : 'none', color: item.status === 'done' ? '#999' : 'inherit' }}>
                                {item.title}
                            </span>
                        </Checkbox>
                    </List.Item>
                )}
             />
             {displayTasks.length === 0 && <Button type="dashed" block size="small" onClick={() => onNavigate?.('2')}>添加任务 (去任务管理)</Button>}
          </Card>
        </Col>

        {/* Column 4: 每日打卡 */}
        <Col span={4} xs={24} sm={12} md={8} lg={4}>
          <Card title="每日打卡" style={{ height: '100%' }}>
            <List
                dataSource={data.habits}
                renderItem={(item: Habit) => {
                    const current = data.habitLogs[today]?.[item.id] || 0;
                    const percent = Math.min(100, Math.round((current / item.targetValue) * 100));
                    return (
                        <div style={{ marginBottom: 15, cursor: 'pointer' }} onClick={() => handleHabitCheck(item.id)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{item.name}</span>
                                <span style={{ fontSize: 12, color: '#888' }}>{current}/{item.targetValue} {item.unit}</span>
                            </div>
                            <Progress percent={percent} size="small" status={percent >= 100 ? 'success' : 'active'} showInfo={false} />
                        </div>
                    );
                }}
            />
          </Card>
        </Col>

        {/* Column 5: 明日计划 */}
        <Col span={5} xs={24} sm={12} md={8} lg={5}>
          <Card title="明日计划" style={{ height: '100%' }} bodyStyle={{ padding: 0, overflow: 'hidden' }}>
            <MarkdownEditor
                value={data.journals[today]?.tomorrowPlan || ''}
                onChange={(val) => handleTomorrowPlanChange(val || '')}
                placeholder="规划一下明天要做什么..."
                height={500}
                preview="live"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DailySummary;
