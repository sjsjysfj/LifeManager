import React, { useState, useEffect, useRef } from 'react';
import { Button, Space, Radio, InputNumber, Input, message, Modal, Form, DatePicker, TimePicker, Card, Typography } from 'antd';
import { PlayCircleFilled, PauseCircleFilled, StopFilled, FullscreenOutlined, FullscreenExitOutlined, PlusCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { getDB, updateDB } from '../services/db';
import type { FocusLog } from '../types';
import SupplementaryFocusModal from '../components/SupplementaryFocusModal';

const { Title, Text } = Typography;

const FocusTimer: React.FC = () => {
  // Mode: 'pomodoro' (25min), 'custom' (countdown), 'stopwatch' (count up)
  const [mode, setMode] = useState<'pomodoro' | 'custom' | 'stopwatch'>('pomodoro');
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(25 * 60); // seconds
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [tag, setTag] = useState('专注学习');
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Manual Add Modal State
  const [isManualModalVisible, setIsManualModalVisible] = useState(false);

  const [hasStarted, setHasStarted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<string | null>(null);

  const resetTimer = React.useCallback(() => {
    setIsActive(false);
    setHasStarted(false);
    startTimeRef.current = null;
    if (mode === 'pomodoro') {
      setTime(25 * 60);
      setInitialTime(25 * 60);
    } else if (mode === 'custom') {
      setTime(customMinutes * 60);
      setInitialTime(customMinutes * 60);
    } else {
      setTime(0);
      setInitialTime(0);
    }
  }, [mode, customMinutes]);

  useEffect(() => {
    // Only reset timer when mode or customMinutes change
    const updateTimer = () => {
        setIsActive(false);
        setHasStarted(false);
        startTimeRef.current = null;
        if (mode === 'pomodoro') {
          setTime(25 * 60);
          setInitialTime(25 * 60);
        } else if (mode === 'custom') {
          setTime(customMinutes * 60);
          setInitialTime(customMinutes * 60);
        } else {
          setTime(0);
          setInitialTime(0);
        }
    };
    
    updateTimer();
    
    if (timerRef.current) clearInterval(timerRef.current);
  }, [mode, customMinutes]);

  const saveRecord = async (completed = false) => {
    if (!startTimeRef.current) return;

    let duration = 0;
    if (mode === 'stopwatch') {
      duration = Math.round(time / 60);
    } else {
      // For countdown, duration is how much time passed
      duration = Math.round((initialTime - time) / 60);
    }

    if (duration < 1 && !completed) {
        message.info('时间太短，不保存记录');
        return;
    }

    const endTime = dayjs().format('HH:mm');
    const today = dayjs().format('YYYY-MM-DD');

    const newLog: FocusLog = {
      id: uuidv4(),
      date: today,
      startTime: startTimeRef.current,
      endTime: endTime,
      duration: Math.max(1, duration), // At least 1 min
      tag: tag
    };

    try {
      const dbData = await getDB();
      const updatedLogs = [...dbData.focusLogs, newLog];
      await updateDB('focusLogs', updatedLogs);
      message.success('专注记录已保存');
    } catch (err) {
      console.error(err);
      message.error('保存失败');
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    message.success('专注完成！休息一下吧。');
    saveRecord(true);
    resetTimer();
  };

  // Use a ref to access the latest handleComplete in setInterval without re-triggering effect
  const handleCompleteRef = useRef(handleComplete);
  useEffect(() => {
    handleCompleteRef.current = handleComplete;
  });
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (mode === 'stopwatch') {
            return prevTime + 1;
          } else {
            if (prevTime <= 0) {
              handleCompleteRef.current();
              return 0;
            }
            return prevTime - 1;
          }
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, mode]);

  const handleStart = () => {
    if (!startTimeRef.current) {
        startTimeRef.current = dayjs().format('HH:mm');
        setHasStarted(true);
    }
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleStop = () => {
    Modal.confirm({
      title: '结束专注?',
      content: '确定要结束当前的专注计时吗？这将保存当前的记录。',
      okText: '确定结束',
      cancelText: '继续',
      onOk: () => {
        saveRecord();
        resetTimer();
      }
    });
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        setIsFullScreen(true);
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            setIsFullScreen(false);
        }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: isFullScreen ? '#000' : 'transparent',
        color: isFullScreen ? '#fff' : 'inherit',
        transition: 'all 0.3s',
        position: 'relative' // For absolute positioning of manual add button
    }}>
      {!isFullScreen && (
          <div style={{ position: 'absolute', top: 0, right: 0 }}>
              <Button 
                type="dashed"
                icon={<PlusCircleOutlined />} 
                onClick={() => setIsManualModalVisible(true)}
              >
                补录记录
              </Button>
          </div>
      )}

      <SupplementaryFocusModal
        visible={isManualModalVisible}
        onCancel={() => setIsManualModalVisible(false)}
        onSuccess={() => setIsManualModalVisible(false)}
      />

      <Card 
        bordered={false} 
        style={{ 
            width: isFullScreen ? '100%' : '100%', 
            maxWidth: isFullScreen ? 'none' : 600,
            background: isFullScreen ? 'transparent' : '#fff',
            boxShadow: isFullScreen ? 'none' : '0 10px 40px rgba(0,0,0,0.05)',
            borderRadius: 24,
            textAlign: 'center'
        }}
        styles={{ body: { padding: isFullScreen ? 0 : 40 } }}
      >
        <Space direction="vertical" align="center" size="large" style={{ width: '100%' }}>
            {!isFullScreen && (
                <div style={{ marginBottom: 20 }}>
                    <Title level={3} style={{ marginBottom: 0 }}>
                        <ClockCircleOutlined style={{ marginRight: 10, color: '#6366f1' }} />
                        专注时刻
                    </Title>
                    <Text type="secondary">保持专注，成就更好的自己</Text>
                </div>
            )}

            {!isActive && (
                <div style={{ 
                    padding: isFullScreen ? '10px 20px' : 0,
                    background: isFullScreen ? 'rgba(255,255,255,0.1)' : 'transparent',
                    borderRadius: isFullScreen ? 30 : 0
                }}>
                    <Radio.Group 
                        value={mode} 
                        onChange={e => setMode(e.target.value)} 
                        buttonStyle="solid" 
                        size="large"
                        className={isFullScreen ? 'dark-mode-radio' : ''}
                    >
                        <Radio.Button value="pomodoro">番茄钟 (25m)</Radio.Button>
                        <Radio.Button value="custom">自定义</Radio.Button>
                        <Radio.Button value="stopwatch">正计时</Radio.Button>
                    </Radio.Group>
                </div>
            )}

            {mode === 'custom' && !isActive && (
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 10, 
                    background: isFullScreen ? 'rgba(255,255,255,0.1)' : '#f9fafb', 
                    padding: '10px 20px', 
                    borderRadius: 12,
                    color: isFullScreen ? '#fff' : 'inherit'
                }}>
                    <span>设置时长(分): </span>
                    <InputNumber 
                        min={1} 
                        max={180} 
                        value={customMinutes} 
                        onChange={v => setCustomMinutes(v || 25)} 
                        bordered={false}
                        style={{ background: isFullScreen ? 'rgba(255,255,255,0.2)' : 'white', borderRadius: 6, width: 60, color: isFullScreen ? 'white' : 'inherit' }}
                    />
                </div>
            )}

            {!isActive && !isFullScreen && (
                <Input
                    prefix={<span style={{ fontSize: 16 }}>🏷️</span>}
                    placeholder="专注内容 (如: 学习React)"
                    value={tag}
                    onChange={e => setTag(e.target.value)}
                    style={{ 
                        width: 300, 
                        textAlign: 'center', 
                        borderRadius: 20, 
                        padding: '8px 20px',
                        fontSize: 16,
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                    }}
                    bordered={false}
                />
            )}

            <div style={{
                fontSize: isFullScreen ? '20vw' : '7rem',
                fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
                fontWeight: 700,
                lineHeight: 1,
                color: isFullScreen ? '#fff' : '#4f46e5',
                margin: '20px 0',
                textShadow: isFullScreen ? '0 0 20px rgba(0,0,0,0.5)' : 'none',
                fontVariantNumeric: 'tabular-nums'
            }}>
                {formatTime(time)}
            </div>

            <Space size={32}>
                {!isActive ? (
                    <Button 
                        type="primary" 
                        shape="circle" 
                        icon={<PlayCircleFilled />} 
                        size="large" 
                        style={{ 
                            width: 80, 
                            height: 80, 
                            fontSize: 32, 
                            boxShadow: '0 10px 20px rgba(79, 70, 229, 0.3)',
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            border: 'none'
                        }} 
                        onClick={handleStart} 
                    />
                ) : (
                    <Button 
                        shape="circle" 
                        icon={<PauseCircleFilled />} 
                        size="large" 
                        style={{ 
                            width: 80, 
                            height: 80, 
                            fontSize: 32,
                            background: '#f3f4f6',
                            color: '#4b5563',
                            border: 'none'
                        }} 
                        onClick={handlePause} 
                    />
                )}
                <Button 
                    danger 
                    shape="circle" 
                    icon={<StopFilled />} 
                    size="large" 
                    style={{ 
                        width: 80, 
                        height: 80, 
                        fontSize: 32,
                        background: hasStarted ? '#fee2e2' : '#f3f4f6',
                        color: hasStarted ? '#ef4444' : '#d1d5db',
                        border: 'none',
                        cursor: hasStarted ? 'pointer' : 'not-allowed'
                    }} 
                    onClick={handleStop} 
                    disabled={!hasStarted} 
                />
            </Space>

            <Button
                type="text"
                icon={isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullScreen}
                style={{ 
                    position: 'fixed', 
                    top: 20, 
                    right: 20, 
                    color: '#fff',
                    background: 'rgba(0,0,0,0.5)', // Increased contrast
                    zIndex: 100,
                    padding: '8px 16px', // Larger click area
                    borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.2)', // Border for better definition
                    backdropFilter: 'blur(4px)', // Glass effect
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)' // Shadow for depth
                }}
            >
                {isFullScreen ? '退出全屏' : '全屏模式'}
            </Button>
        </Space>
      </Card>
    </div>
  );
};

export default FocusTimer;
