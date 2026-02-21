import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Card, Col, Row, Typography, Checkbox, Progress, Button, List, message, Statistic, Divider, Tag, Empty, Space } from 'antd';
import { SmileOutlined, CheckCircleOutlined, ClockCircleOutlined, ExportOutlined, FireOutlined, CalendarOutlined, PlusCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import html2canvas from 'html2canvas';
import { v4 as uuidv4 } from 'uuid';
import { getDB, updateDB } from '../services/db';
import type { DBData, DailyJournal, Habit, Task } from '../types';
import SupplementaryFocusModal from '../components/SupplementaryFocusModal';
import { formatDuration, formatTimeRange } from '../utils/timeUtils';

dayjs.locale('zh-cn');

import MarkdownEditor from '../components/MarkdownEditor';

const { Title, Text } = Typography;

interface DailySummaryProps {
    onNavigate?: (key: string) => void;
}

const DailySummary: React.FC<DailySummaryProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DBData | null>(null);
  const [today] = useState(dayjs().format('YYYY-MM-DD'));

  // Refs - must be declared before useEffect to maintain Hooks order
  const pageRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef<DBData | null>(null);
  const journalsUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef(false);

  const [isManualModalVisible, setIsManualModalVisible] = useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const dbData = await getDB();
      const updatedData = { ...dbData };
      let needsUpdate = false;

      // 1. Initialize today's journal if not exists
      if (!updatedData.journals[today]) {
        // Check for yesterday's "tomorrow plan"
        const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
        const yesterdayJournal = updatedData.journals[yesterday];

        if (yesterdayJournal?.tomorrowPlan) {
            // Split by newline and filter empty lines, remove markdown chars
            const lines = yesterdayJournal.tomorrowPlan
                .split(/\r?\n/)
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
  }, [today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    return () => {
      if (journalsUpdateTimer.current) {
        clearTimeout(journalsUpdateTimer.current);
        journalsUpdateTimer.current = null;
        const latestData = dataRef.current;
        if (latestData) {
          void updateDB('journals', latestData.journals);
        }
      }
    };
  }, []);

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
  }, [fetchData]);

  const scheduleJournalsUpdate = (nextJournals: DBData['journals']) => {
    if (journalsUpdateTimer.current) {
      clearTimeout(journalsUpdateTimer.current);
    }
    journalsUpdateTimer.current = setTimeout(async () => {
      try {
        await updateDB('journals', nextJournals);
      } catch (error) {
        console.error('Failed to update journals:', error);
        message.error('保存失败，请重试');
      }
    }, 400);
  };

  const handleLifeLogChange = (val: string) => {
    const currentData = dataRef.current;
    if (!currentData) return;
    const updatedJournals = {
      ...currentData.journals,
      [today]: { ...currentData.journals[today], lifeLog: val }
    };
    const nextData = { ...currentData, journals: updatedJournals };
    dataRef.current = nextData;
    setData(nextData);
    scheduleJournalsUpdate(updatedJournals);
  };

  const handleTomorrowPlanChange = (val: string) => {
    const currentData = dataRef.current;
    if (!currentData) return;
    const updatedJournals = {
      ...currentData.journals,
      [today]: { ...currentData.journals[today], tomorrowPlan: val }
    };
    const nextData = { ...currentData, journals: updatedJournals };
    dataRef.current = nextData;
    setData(nextData);
    scheduleJournalsUpdate(updatedJournals);
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
    // @ts-expect-error We know data is not null here, but TypeScript might need help
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

  // Derived Data - must be before early return to maintain Hooks order
  const displayTasks = useMemo(() => {
    if (!data) return [];
    return data.tasks.filter(t => {
      return t.planDate === today || t.dueDate === today;
    });
  }, [data, today]);

  const todayFocusLogs = useMemo(() => {
    if (!data) return [];
    return data.focusLogs
      .filter(l => l.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [data, today]);

  const totalFocusTime = useMemo(() => {
    return todayFocusLogs.reduce((acc, cur) => acc + cur.duration, 0);
  }, [todayFocusLogs]);
  
  const formattedTotalFocusTime = formatDuration(totalFocusTime);

  if (loading || !data) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <div className="loader">Loading...</div>
        </div>
    );
  }

  const cardStyle = {
    height: '100%',
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    border: 'none',
    overflow: 'hidden'
  };

  const headerStyle = {
    background: 'linear-gradient(to right, #f8f9fa, #ffffff)',
    borderBottom: '1px solid #f0f0f0',
    padding: '16px 24px',
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '凌晨好，注意休息';
    if (hour < 12) return '早上好，开启元气满满的一天';
    if (hour < 18) return '下午好，继续加油';
    return '晚上好，享受静谧时光';
  };

  return (
    <div ref={pageRef} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card
        style={{ 
          marginBottom: 24, 
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
          border: 'none', 
          borderRadius: 16,
          boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)'
        }}
        styles={{ body: { padding: '24px 32px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
            <div>
                <Title level={2} style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: 28 }}>
                    {getGreeting()}
                </Title>
                <div style={{ marginTop: 8, opacity: 0.9, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CalendarOutlined />
                    <span>今天是 {dayjs().format('MM月DD日 dddd')}</span>
                </div>
            </div>
            <Button 
                ghost 
                icon={<ExportOutlined />} 
                onClick={handleExport}
                size="large"
                style={{ borderRadius: 12, height: 44, padding: '0 24px', border: '2px solid rgba(255,255,255,0.6)' }}
            >
                导出图片
            </Button>
        </div>
      </Card>

      <Row gutter={[24, 24]} style={{ flex: 1 }}>
        {/* Column 1: 今日学习 & 专注 */}
        <Col span={6} xs={24} sm={12} md={8} lg={6} style={{ display: 'flex', flexDirection: 'column' }}>
          <Card 
            title={<Space><ClockCircleOutlined style={{ color: '#6366f1' }} /> 今日专注</Space>} 
            extra={
              <Button 
                type="dashed" 
                size="small"
                icon={<PlusCircleOutlined />} 
                onClick={() => setIsManualModalVisible(true)}
                style={{ 
                  color: '#6366f1', 
                  borderColor: '#6366f1', 
                  background: 'rgba(99, 102, 241, 0.05)',
                  fontSize: '12px'
                }}
              >
                补录
              </Button>
            }
            style={cardStyle}
            styles={{ header: headerStyle, body: { padding: 24, flex: 1 } }}
          >
             <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: '#6366f1', lineHeight: 1 }}>
                    {formattedTotalFocusTime.value}
                    <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 400, marginLeft: 4 }}>{formattedTotalFocusTime.unit}</span>
                </div>
                <Text type="secondary">今日总专注时长</Text>
             </div>
             
             <List
                itemLayout="horizontal"
                dataSource={todayFocusLogs}
                renderItem={item => (
                    <List.Item style={{ 
                        padding: '12px 0', 
                        borderBottom: '1px solid #f3f4f6',
                        background: item.isConcurrent ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                        borderLeft: item.isConcurrent ? '3px solid #6366f1' : 'none',
                        paddingLeft: item.isConcurrent ? 12 : 0
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Tag color={item.isConcurrent ? "purple" : "blue"}>
                                        {formatTimeRange(item.startTime, item.endTime)}
                                    </Tag>
                                    {item.isConcurrent && <Tag color="orange" style={{ fontSize: 10, lineHeight: '18px' }}>并行</Tag>}
                                </div>
                                <span style={{ fontWeight: 500, color: '#374151', wordBreak: 'break-word' }}>{item.tag}</span>
                            </div>
                            <span style={{ color: '#6b7280', whiteSpace: 'nowrap', marginLeft: 8 }}>
                                {(() => {
                                    const { value, unit } = formatDuration(item.duration);
                                    return `${value}${unit}`;
                                })()}
                            </span>
                        </div>
                    </List.Item>
                )}
             />
             {todayFocusLogs.length === 0 && (
                 <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无专注记录，开始学习吧！" />
             )}
          </Card>
        </Col>

        {/* Column 2: 今日生活 (Markdown) */}
        <Col span={6} xs={24} sm={12} md={8} lg={6} style={{ display: 'flex', flexDirection: 'column' }}>
          <Card 
            title={<Space><SmileOutlined style={{ color: '#ec4899' }} /> 今日随笔</Space>} 
            style={cardStyle}
            styles={{ header: headerStyle, body: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' } }}
          >
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <MarkdownEditor
                    value={data.journals[today]?.lifeLog || ''}
                    onChange={(val) => handleLifeLogChange(val || '')}
                    placeholder="记录今天发生的趣事、感悟..."
                    height="100%"
                    preview="live"
                />
            </div>
          </Card>
        </Col>

        {/* Column 3: 今日计划 (Tasks & Habits) */}
        <Col span={6} xs={24} sm={12} md={8} lg={6} style={{ display: 'flex', flexDirection: 'column' }}>
          <Card 
            title={<Space><CheckCircleOutlined style={{ color: '#10b981' }} /> 今日目标</Space>} 
            style={cardStyle}
            styles={{ header: headerStyle, body: { padding: 24, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' } }}
          >
             <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                        <FireOutlined style={{ color: '#f59e0b', marginRight: 8 }} />
                        <span style={{ fontWeight: 600, color: '#374151' }}>习惯打卡</span>
                    </div>
                    {data.habits.map((item: Habit) => {
                        const current = data.habitLogs[today]?.[item.id] || 0;
                        const percent = Math.min(100, Math.round((current / item.targetValue) * 100));
                        return (
                            <div key={item.id} style={{ marginBottom: 16, cursor: 'pointer', padding: '8px 12px', background: '#f9fafb', borderRadius: 8 }} onClick={() => handleHabitCheck(item.id)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</span>
                                    <span style={{ fontSize: 12, color: '#6b7280' }}>{current}/{item.targetValue} {item.unit}</span>
                                </div>
                                <Progress percent={percent} size="small" strokeColor="#f59e0b" showInfo={false} />
                            </div>
                        );
                    })}
                    {data.habits.length === 0 && <Text type="secondary" style={{ fontSize: 12 }}>暂无习惯，去设置添加吧</Text>}
                </div>
                
                <Divider style={{ margin: '12px 0' }} />
                
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                        <CheckCircleOutlined style={{ color: '#10b981', marginRight: 8 }} />
                        <span style={{ fontWeight: 600, color: '#374151' }}>待办清单</span>
                    </div>
                    <List
                        dataSource={displayTasks}
                        split={false}
                        renderItem={item => (
                            <List.Item style={{ padding: '8px 0' }}>
                                <Checkbox
                                    checked={item.status === 'done'}
                                    onChange={e => handleTaskCheck(item.id, e.target.checked)}
                                    style={{ width: '100%' }}
                                >
                                    <span style={{ 
                                        textDecoration: item.status === 'done' ? 'line-through' : 'none', 
                                        color: item.status === 'done' ? '#9ca3af' : '#374151',
                                        transition: 'all 0.2s'
                                    }}>
                                        {item.title}
                                    </span>
                                </Checkbox>
                            </List.Item>
                        )}
                    />
                     {displayTasks.length === 0 && (
                         <div style={{ textAlign: 'center', padding: 20 }}>
                             <Text type="secondary">今日暂无任务</Text>
                             <Button type="link" size="small" onClick={() => onNavigate?.('2')}>去添加</Button>
                         </div>
                     )}
                </div>
             </div>
          </Card>
        </Col>

        {/* Column 4: 明日计划 */}
        <Col span={6} xs={24} sm={12} md={8} lg={6} style={{ display: 'flex', flexDirection: 'column' }}>
          <Card 
            title="明日规划" 
            style={cardStyle}
            styles={{ header: headerStyle, body: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' } }}
          >
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <MarkdownEditor
                    value={data.journals[today]?.tomorrowPlan || ''}
                    onChange={(val) => handleTomorrowPlanChange(val || '')}
                    placeholder="规划一下明天要做什么..."
                    height="100%"
                    preview="live"
                />
            </div>
          </Card>
        </Col>
      </Row>
      
      <SupplementaryFocusModal
        visible={isManualModalVisible}
        onCancel={() => setIsManualModalVisible(false)}
        onSuccess={() => {
            setIsManualModalVisible(false);
            fetchData();
        }}
      />
    </div>
  );
};

export default DailySummary;
