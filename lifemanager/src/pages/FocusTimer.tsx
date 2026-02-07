import React, { useState, useEffect, useRef } from 'react';
import { Button, Space, Radio, InputNumber, Input, message, Modal, Form, DatePicker, TimePicker } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, StopOutlined, FullscreenOutlined, FullscreenExitOutlined, PlusCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { getDB, updateDB } from '../services/db';
import type { FocusLog } from '../types';
import MarkdownEditor from '../components/MarkdownEditor';

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
  const [manualForm] = Form.useForm();
  const [manualContent, setManualContent] = useState('');

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

  const handleManualAdd = async () => {
    try {
      const values = await manualForm.validateFields();
      const date = values.date.format('YYYY-MM-DD');
      const startTime = values.startTime.format('HH:mm');
      // endTime is optional or calculated
      const endTime = values.endTime ? values.endTime.format('HH:mm') : dayjs(values.startTime).add(values.duration, 'minute').format('HH:mm');
      
      const newLog: FocusLog = {
        id: uuidv4(),
        date: date,
        startTime: startTime,
        endTime: endTime,
        duration: values.duration,
        tag: values.tag,
        content: manualContent
      };

      const dbData = await getDB();
      const updatedLogs = [...dbData.focusLogs, newLog];
      await updateDB('focusLogs', updatedLogs);
      message.success('学习记录添加成功');
      setIsManualModalVisible(false);
      manualForm.resetFields();
      setManualContent('');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: isFullScreen ? '#000' : 'transparent',
        color: isFullScreen ? '#fff' : 'inherit',
        transition: 'all 0.3s',
        position: 'relative' // For absolute positioning of manual add button
    }}>
      {!isFullScreen && (
          <Button 
            icon={<PlusCircleOutlined />} 
            onClick={() => setIsManualModalVisible(true)}
            style={{ position: 'absolute', top: 20, left: 20 }}
          >
            补录记录
          </Button>
      )}

      <Modal
        title="手动添加学习记录"
        open={isManualModalVisible}
        onOk={handleManualAdd}
        onCancel={() => setIsManualModalVisible(false)}
        width={800}
      >
        <Form form={manualForm} layout="vertical" initialValues={{ date: dayjs(), duration: 30, tag: '自主学习' }}>
            <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item name="date" label="日期" rules={[{ required: true }]}>
                    <DatePicker />
                </Form.Item>
                <Form.Item name="startTime" label="开始时间" rules={[{ required: true }]}>
                    <TimePicker format="HH:mm" />
                </Form.Item>
                <Form.Item name="endTime" label="结束时间">
                    <TimePicker format="HH:mm" />
                </Form.Item>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item name="duration" label="时长(分钟)" rules={[{ required: true }]}>
                    <InputNumber min={1} />
                </Form.Item>
                <Form.Item name="tag" label="标签" rules={[{ required: true }]} style={{ flex: 1 }}>
                    <Input />
                </Form.Item>
            </div>
            <Form.Item label="学习内容/笔记 (Markdown)">
                <MarkdownEditor 
                    value={manualContent} 
                    onChange={(val) => setManualContent(val || '')}
                    height={300}
                />
            </Form.Item>
        </Form>
      </Modal>

      <Space direction="vertical" align="center" size="large">
        {!isActive && !isFullScreen && (
            <Radio.Group value={mode} onChange={e => setMode(e.target.value)} buttonStyle="solid">
                <Radio.Button value="pomodoro">番茄钟 (25m)</Radio.Button>
                <Radio.Button value="custom">自定义倒计时</Radio.Button>
                <Radio.Button value="stopwatch">正计时</Radio.Button>
            </Radio.Group>
        )}

        {mode === 'custom' && !isActive && !isFullScreen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>设置时长(分): </span>
                <InputNumber min={1} max={180} value={customMinutes} onChange={v => setCustomMinutes(v || 25)} />
            </div>
        )}

        {!isActive && !isFullScreen && (
             <Input
                prefix="🏷️"
                placeholder="专注内容 (如: 学习React)"
                value={tag}
                onChange={e => setTag(e.target.value)}
                style={{ width: 300, textAlign: 'center' }}
             />
        )}

        <div style={{
            fontSize: isFullScreen ? '15vw' : '8rem',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            lineHeight: 1,
            color: isFullScreen ? '#fff' : '#1890ff'
        }}>
            {formatTime(time)}
        </div>

        <Space size="large">
            {!isActive ? (
                <Button type="primary" shape="circle" icon={<PlayCircleOutlined />} size="large" style={{ width: 80, height: 80, fontSize: 32 }} onClick={handleStart} />
            ) : (
                <Button shape="circle" icon={<PauseCircleOutlined />} size="large" style={{ width: 80, height: 80, fontSize: 32 }} onClick={handlePause} />
            )}
            <Button danger shape="circle" icon={<StopOutlined />} size="large" style={{ width: 80, height: 80, fontSize: 32 }} onClick={handleStop} disabled={!hasStarted} />
        </Space>

        <Button
            type="text"
            icon={isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullScreen}
            style={{ position: 'fixed', top: 20, right: 20, color: isFullScreen ? '#fff' : 'inherit' }}
        >
            {isFullScreen ? '退出全屏' : '全屏模式'}
        </Button>
      </Space>
    </div>
  );
};

export default FocusTimer;
