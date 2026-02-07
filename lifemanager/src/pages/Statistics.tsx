import React, { useEffect, useMemo, useState } from 'react';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import dayjs from 'dayjs';
import { getDB } from '../services/db';
import type { DBData } from '../types';

const { Title } = Typography;

const Statistics: React.FC = () => {
  const [data, setData] = useState<DBData | null>(null);

  useEffect(() => {
    getDB().then(setData);
  }, []);

  // Derived data - must be before early return to maintain Hooks order
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = dayjs().subtract(6 - i, 'day');
      return d.format('YYYY-MM-DD');
    });
  }, []);

  const focusData = useMemo(() => {
    if (!data) return [];
    return last7Days.map(date => {
      const logs = data.focusLogs.filter(l => l.date === date);
      const totalMinutes = logs.reduce((acc, cur) => acc + cur.duration, 0);
      return {
        date: dayjs(date).format('MM-DD'),
        minutes: totalMinutes
      };
    });
  }, [data, last7Days]);

  const habitData = useMemo(() => {
    if (!data) return [];
    return last7Days.map(date => {
      const log = data.habitLogs[date] || {};
      let totalPercent = 0;
      let count = 0;

      data.habits.forEach(h => {
        const val = log[h.id] || 0;
        const p = Math.min(100, (val / h.targetValue) * 100);
        totalPercent += p;
        count++;
      });

      return {
        date: dayjs(date).format('MM-DD'),
        rate: count > 0 ? Math.round(totalPercent / count) : 0
      };
    });
  }, [data, last7Days]);

  const totalFocusAllTime = useMemo(() => {
    if (!data) return 0;
    return data.focusLogs.reduce((acc, cur) => acc + cur.duration, 0);
  }, [data]);

  const totalCompletedTasks = useMemo(() => {
    if (!data) return 0;
    return data.tasks.filter(t => t.status === 'done').length;
  }, [data]);

  if (!data) return <div>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>数据统计</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <Statistic title="总专注时长 (分钟)" value={totalFocusAllTime} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic title="已完成任务总数" value={totalCompletedTasks} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24} lg={12}>
          <Card title="近7天专注时长趋势">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={focusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="minutes" name="专注时长(分)" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col span={24} lg={12}>
          <Card title="近7天习惯打卡平均完成率">
             <ResponsiveContainer width="100%" height={300}>
              <LineChart data={habitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="rate" name="完成率(%)" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;
