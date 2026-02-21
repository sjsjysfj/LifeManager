import React, { useState, useEffect } from 'react';
import { Modal, Form, DatePicker, TimePicker, InputNumber, Input, message, Checkbox } from 'antd';
import dayjs from 'dayjs';
import MarkdownEditor from './MarkdownEditor';
import { addSupplementaryRecord } from '../services/focusService';
import { checkTimeConflict } from '../utils/timeUtils';
import { getDB } from '../services/db';
import type { FocusLog } from '../types';

interface SupplementaryFocusModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const SupplementaryFocusModal: React.FC<SupplementaryFocusModalProps> = ({ visible, onCancel, onSuccess }) => {
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [manualForm] = Form.useForm();
  const [manualContent, setManualContent] = useState('');
  const [lastDurationType, setLastDurationType] = useState<'auto' | 'manual'>('auto');
  const [existingLogs, setExistingLogs] = useState<FocusLog[]>([]);

  // Fetch existing logs when modal opens
  useEffect(() => {
    if (visible) {
        const fetchLogs = async () => {
            const dbData = await getDB();
            setExistingLogs(dbData.focusLogs);
        };
        fetchLogs();
    }
  }, [visible]);

  // Watch form values to auto-calculate duration
  const onValuesChange = (changedValues: any, allValues: any) => {
    const { startTime, endTime, duration } = allValues;
    
    // Case 1: If user manually changes duration, mark as manual override
    if ('duration' in changedValues) {
      setLastDurationType('manual');
      return;
    }

    // Case 2: If start or end time changes, try to auto-calculate
    if ('startTime' in changedValues || 'endTime' in changedValues) {
      if (startTime && endTime) {
        // Both times present - calculate difference
        let diff = endTime.diff(startTime, 'minute');
        // Handle cross-day (if end time is before start time, assume next day)
        if (diff < 0) diff += 24 * 60;
        
        if (diff > 0) {
            manualForm.setFieldsValue({ duration: diff });
            setLastDurationType('auto');
        }
      } else if (startTime || endTime) {
        // Only one time present - default to 30 if not already set or if switching from auto
        // And if duration was previously auto-calculated (or user cleared one field), maybe reset to 30?
        // Requirement 2: "When only one is filled, default to 30 minutes"
        // Let's force it to 30 if we just lost the second time, or if duration is empty.
        // Also if we are in 'auto' mode, we should reset to default.
        if (!duration || lastDurationType === 'auto') {
             manualForm.setFieldsValue({ duration: 30 });
             setLastDurationType('auto'); // Still considered auto/default
        }
      }
    }
  };

  const handleManualAdd = async () => {
    try {
      setConfirmLoading(true);
      const values = await manualForm.validateFields();
      const date = values.date.format('YYYY-MM-DD');
      
      let startTime = values.startTime ? values.startTime.format('HH:mm') : null;
      let endTime = values.endTime ? values.endTime.format('HH:mm') : null;
      let duration = values.duration;

      // Requirement 2: Default to 30 if only one time provided
      if (!startTime && !endTime) {
          message.error('请至少填写开始时间或结束时间');
          setConfirmLoading(false);
          return;
      }
      
      // Calculate missing time based on duration
      if (startTime && !endTime) {
          endTime = dayjs(values.startTime).add(duration, 'minute').format('HH:mm');
      } else if (!startTime && endTime) {
          startTime = dayjs(values.endTime).subtract(duration, 'minute').format('HH:mm');
      }
      
      // If both provided, trust the user's duration (even if it mismatches time diff, per requirement 3)
      // OR re-calculate? Requirement 2 says "System auto calculates... user can still manually adjust".
      // This implies the saved duration is what's in the box.

      // Limit to current date and time
      const now = dayjs();
      const recordDateTime = dayjs(`${date} ${endTime}`);
      if (recordDateTime.isAfter(now)) {
        message.error('不能补录未来的记录');
        setConfirmLoading(false);
        return;
      }

      // Check for conflicts
      if (!values.isConcurrent) {
          const conflicts = checkTimeConflict(startTime, endTime, existingLogs.filter(l => l.date === date));
          if (conflicts.length > 0) {
              message.error(`与已有记录时间冲突: ${conflicts[0].tag} (${conflicts[0].startTime}-${conflicts[0].endTime})`);
              setConfirmLoading(false);
              return;
          }
      }

      await addSupplementaryRecord({
        date,
        startTime,
        endTime,
        duration,
        tag: values.tag,
        content: manualContent,
        isConcurrent: values.isConcurrent
      });

      message.success('学习记录补录成功！');
      onSuccess();
      manualForm.resetFields();
      setManualContent('');
    } catch (error: any) {
      console.error('Operation failed:', error);
      if (error?.errorFields) {
        message.error('请填写完整信息');
      } else {
        message.error('保存失败，请重试');
      }
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <Modal
      title="手动添加学习记录"
      open={visible}
      onOk={handleManualAdd}
      confirmLoading={confirmLoading}
      onCancel={onCancel}
      width={800}
      destroyOnClose
    >
      <Form form={manualForm} layout="vertical" initialValues={{ date: dayjs(), duration: 30, tag: '自主学习' }} onValuesChange={onValuesChange}>
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item name="date" label="日期" rules={[{ required: true }]}>
            <DatePicker disabledDate={(current) => current && current > dayjs().endOf('day')} />
          </Form.Item>
          <Form.Item 
            name="startTime" 
            label="开始时间" 
            rules={[
                { 
                    validator: async (_, value) => {
                        const endTime = manualForm.getFieldValue('endTime');
                        if (!value && !endTime) {
                            return Promise.reject(new Error('开始时间和结束时间至少填写一个'));
                        }
                        return Promise.resolve();
                    }
                }
            ]}
          >
            <TimePicker format="HH:mm" allowClear />
          </Form.Item>
          <Form.Item 
            name="endTime" 
            label="结束时间"
            rules={[
                { 
                    validator: async (_, value) => {
                        const startTime = manualForm.getFieldValue('startTime');
                        if (!value && !startTime) {
                            return Promise.reject(new Error('开始时间和结束时间至少填写一个'));
                        }
                        return Promise.resolve();
                    }
                }
            ]}
          >
            <TimePicker format="HH:mm" allowClear />
          </Form.Item>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item 
            name="duration" 
            label="时长(分钟)" 
            rules={[{ required: true }]}
            help={lastDurationType === 'auto' ? "根据时间自动计算" : "用户手动修改"}
          >
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item name="tag" label="标签" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </div>
        <Form.Item name="isConcurrent" valuePropName="checked">
            <Checkbox>与已有记录同时进行</Checkbox>
        </Form.Item>
        <Form.Item label="学习内容/笔记 (Markdown)">
          <MarkdownEditor 
            value={manualContent} 
            onChange={(val) => setManualContent(val || '')}
            height={300}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SupplementaryFocusModal;
