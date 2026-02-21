import React, { useEffect, useMemo, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, Spin } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { ClockCircleOutlined, CheckCircleOutlined, FireOutlined, RiseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getDB } from '../services/db';
import type { DBData } from '../types';

const { Title } = Typography;

const Statistics: React.FC = () => {
  const [data, setData] = useState<DBData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDB().then((dbData) => {
        setData(dbData);
        setLoading(false);
    });
  }, []);

  // Derived data
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
    const result = last7Days.map(date => {
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
    return result;
  }, [data, last7Days]);

  const totalFocusAllTime = useMemo(() => {
    if (!data) return 0;
    return data.focusLogs.reduce((acc, cur) => acc + cur.duration, 0);
  }, [data]);

  const totalCompletedTasks = useMemo(() => {
    if (!data) return 0;
    return data.tasks.filter(t => t.status === 'done').length;
  }, [data]);

  if (loading || !data) {
      return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Spin size="large" />
          </div>
      );
  }

  const cardStyle = {
    borderRadius: 16,
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
    border: 'none',
    height: '100%'
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} styles={{ body: { padding: 24 } }}>
            <Statistic 
                title={<span style={{ color: '#6b7280' }}>总专注时长</span>}
                value={totalFocusAllTime} 
                suffix="分钟"
                valueStyle={{ color: '#6366f1', fontWeight: 700 }}
                prefix={<ClockCircleOutlined style={{ marginRight: 8, color: '#6366f1' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 24 }}>
            <Statistic 
                title={<span style={{ color: '#6b7280' }}>已完成任务</span>}
                value={totalCompletedTasks} 
                valueStyle={{ color: '#10b981', fontWeight: 700 }}
                prefix={<CheckCircleOutlined style={{ marginRight: 8, color: '#10b981' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} styles={{ body: { padding: 24 } }}>
             <Statistic 
                title={<span style={{ color: '#6b7280' }}>习惯打卡率 (近7天)</span>}
                value={habitData.length > 0 ? Math.round(habitData.reduce((acc, cur) => acc + cur.rate, 0) / habitData.length) : 0} 
                suffix="%"
                valueStyle={{ color: '#f59e0b', fontWeight: 700 }}
                prefix={<FireOutlined style={{ marginRight: 8, color: '#f59e0b' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 24 }}>
             <Statistic 
                title={<span style={{ color: '#6b7280' }}>日均专注 (近7天)</span>}
                value={focusData.length > 0 ? Math.round(focusData.reduce((acc, cur) => acc + cur.minutes, 0) / focusData.length) : 0} 
                suffix="分钟"
                valueStyle={{ color: '#3b82f6', fontWeight: 700 }}
                prefix={<RiseOutlined style={{ marginRight: 8, color: '#3b82f6' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col span={24} lg={12}>
          <Card title="近7天专注时长趋势" style={cardStyle} styles={{ header: { borderBottom: '1px solid #f3f4f6' } }}>
            <div style={{ height: 350, marginTop: 10 }}>
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={focusData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                    <Tooltip 
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        cursor={{ fill: '#f3f4f6' }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="minutes" name="专注时长(分)" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
                </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col span={24} lg={12}>
          <Card title="近7天习惯打卡完成率趋势" style={cardStyle} styles={{ header: { borderBottom: '1px solid #f3f4f6' } }}>
             <div style={{ height: 350, marginTop: 10 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={habitData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="rate" name="完成率(%)" stroke="#10b981" fillOpacity={1} fill="url(#colorRate)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;
