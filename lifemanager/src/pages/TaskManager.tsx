import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tag,
  Space,
  Card,
  message,
  Popconfirm,
  Checkbox,
  Tooltip,
  Avatar
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { getDB, updateDB } from '../services/db';
import type { Task, TaskStatus } from '../types';

import MarkdownEditor from '../components/MarkdownEditor';

const { Option } = Select;

type TaskKanbanProps = {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDragEnd: (result: DropResult) => void;
};

const TaskKanban: React.FC<TaskKanbanProps> = React.memo(({ tasks, onEdit, onDragEnd }) => {
  const columns = useMemo(() => ([
    { id: 'todo' as TaskStatus, title: '待办 (To Do)', color: '#f59e0b' },
    { id: 'in_progress' as TaskStatus, title: '进行中 (In Progress)', color: '#3b82f6' },
    { id: 'done' as TaskStatus, title: '已完成 (Done)', color: '#10b981' },
  ]), []);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    tasks.forEach(task => {
      map[task.status].push(task);
    });
    return map;
  }, [tasks]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: 'flex', gap: '24px', height: '100%', overflowX: 'auto', paddingBottom: 10 }}>
        {columns.map(col => (
          <Droppable key={col.id} droppableId={col.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  background: snapshot.isDraggingOver ? '#f3f4f6' : '#f9fafb',
                  padding: 16,
                  width: 320,
                  minWidth: 320,
                  borderRadius: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: 16, color: '#374151' }}>{col.title}</span>
                    <Tag color={col.color} style={{ borderRadius: 10, margin: 0 }}>{tasksByStatus[col.id].length}</Tag>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
                    {tasksByStatus[col.id].map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                            userSelect: 'none',
                            marginBottom: 12,
                            ...provided.draggableProps.style,
                            }}
                        >
                            <Card
                            size="small"
                            bordered={false}
                            style={{
                                boxShadow: snapshot.isDragging ? '0 10px 25px rgba(0,0,0,0.1)' : '0 2px 5px rgba(0,0,0,0.02)',
                                borderRadius: 12,
                                transition: 'all 0.2s',
                                cursor: 'grab'
                            }}
                            styles={{ body: { padding: 16 } }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <Tag color={task.type === 'study' ? 'blue' : task.type === 'habit' ? 'green' : 'orange'} style={{ borderRadius: 4, marginRight: 0 }}>
                                        {task.type === 'study' ? '学习' : task.type === 'habit' ? '习惯' : '生活'}
                                    </Tag>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                                        style={{ color: '#9ca3af' }}
                                    />
                                </div>
                                <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 12, color: '#1f2937' }}>{task.title}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#6b7280' }}>
                                    <Space size={4}>
                                        <CalendarOutlined />
                                        <span>{task.dueDate}</span>
                                    </Space>
                                    {task.isDailyPlan && (
                                        <Tooltip title="今日计划">
                                            <CheckCircleOutlined style={{ color: '#10b981' }} />
                                        </Tooltip>
                                    )}
                                </div>
                            </Card>
                        </div>
                        )}
                    </Draggable>
                    ))}
                    {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
});

type TaskTableProps = {
  tasks: Task[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: any[];
};

const TaskTable: React.FC<TaskTableProps> = React.memo(({ tasks, columns }) => {
  return (
      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: 'none' }}>
        <Table 
            dataSource={tasks} 
            columns={columns} 
            rowKey="id" 
            pagination={{ pageSize: 10 }}
        />
      </Card>
  );
});

const TaskManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('table');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const [description, setDescription] = useState('');

  // Ref to track saving state and modal visibility for the event listener
  const isSaving = React.useRef(false);
  const isModalVisibleRef = React.useRef(isModalVisible);

  // Keep the ref in sync with the state
  useEffect(() => {
    isModalVisibleRef.current = isModalVisible;
  }, [isModalVisible]);

  useEffect(() => {
    // Initial fetch only on mount
    fetchTasks();

    const handleFocus = () => {
        // Use refs to check current state without re-binding the listener
        if (isSaving.current || isModalVisibleRef.current) return;
        fetchTasks();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
        window.removeEventListener('focus', handleFocus);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const fetchTasks = async () => {
    try {
        const dbData = await getDB();
        if (dbData && dbData.tasks) {
            setTasks(dbData.tasks);
        }
    } catch (error) {
        console.error("Failed to fetch tasks:", error);
    }
  };

  const handleAdd = () => {
    setEditingTask(null);
    form.resetFields();
    setDescription('');
    setIsModalVisible(true);
  };

  const handleEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setDescription(task.description || '');
    form.setFieldsValue({
      ...task,
      dueDate: dayjs(task.dueDate),
    });
    setIsModalVisible(true);
  }, [form]);

  const handleDelete = useCallback(async (id: string) => {
    const newTasks = tasks.filter(t => t.id !== id);
    setTasks(newTasks);
    await updateDB('tasks', newTasks);
    message.success('任务已删除');
  }, [tasks]);

  const handleOk = async () => {
    try {
      isSaving.current = true;
      const values = await form.validateFields();
      const taskData = {
        ...values,
        description: description,
        dueDate: values.dueDate.format('YYYY-MM-DD'),
      };

      let newTasks = [...tasks];
      const todayStr = dayjs().format('YYYY-MM-DD');

      if (editingTask) {
        newTasks = newTasks.map(t => {
            if (t.id === editingTask.id) {
                return {
                    ...t,
                    ...taskData,
                    // If checked "isDailyPlan", set planDate to today, otherwise undefined
                    planDate: taskData.isDailyPlan ? todayStr : undefined
                };
            }
            return t;
        });
        message.success('任务更新成功');
      } else {
        const newTask: Task = {
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          status: 'todo',
          isDailyPlan: false,
          ...taskData,
          // If checked "isDailyPlan", set planDate to today
          planDate: taskData.isDailyPlan ? todayStr : undefined
        };
        newTasks.push(newTask);
        message.success('任务创建成功');
      }

      // Update DB first, then update UI
      try {
          console.log('[Frontend] Sending tasks to DB:', newTasks.length);
          const updatedDB = await updateDB('tasks', newTasks);
          console.log('[Frontend] Received from DB:', updatedDB);

          // Use the returned data to ensure consistency
          if (updatedDB && Array.isArray(updatedDB.tasks)) {
              console.log('[Frontend] Setting tasks from DB response:', updatedDB.tasks.length);
              setTasks(updatedDB.tasks);
          } else {
              // Fallback to optimistic update if DB returns unexpected data
              console.log('[Frontend] DB returned unexpected data, using optimistic update');
              setTasks(newTasks);
          }
          message.success(editingTask ? '任务更新成功' : '任务创建成功');
      } catch (dbError) {
          console.error("[Frontend] Database update failed:", dbError);
          message.error('保存失败，请重试');
          return; // Don't close modal on error
      } finally {
          isSaving.current = false;
      }

      setIsModalVisible(false);
    } catch (info) {
      console.log('Validate Failed:', info);
      message.error('表单验证失败，请检查输入');
    }
  };

  // --- Kanban Logic ---
  const onDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    const updatedTasks = tasks.map(t =>
      t.id === draggableId ? { ...t, status: newStatus } : t
    );

    setTasks(updatedTasks);
    await updateDB('tasks', updatedTasks);
  }, [tasks]);

  // --- Table Logic ---
  const columns = useMemo(() => ([
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'study' ? 'blue' : type === 'habit' ? 'green' : 'orange'} style={{ borderRadius: 10 }}>
          {type === 'study' ? '学习' : type === 'habit' ? '习惯' : '生活'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
          const color = status === 'done' ? 'success' : status === 'in_progress' ? 'processing' : 'default';
          const text = status === 'done' ? '已完成' : status === 'in_progress' ? '进行中' : '待办';
          return <Tag color={color} style={{ borderRadius: 10 }}>{text}</Tag>;
      }
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => <span style={{ color: '#6b7280' }}>{date}</span>
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Task) => (
        <Space size="middle">
          <Tooltip title="编辑">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record.id)}>
             <Tooltip title="删除">
                <Button type="text" icon={<DeleteOutlined />} danger />
             </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]), [handleEdit, handleDelete]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
                { key: 'table', label: <span><UnorderedListOutlined />列表视图</span> },
                { key: 'kanban', label: <span><AppstoreOutlined />看板视图</span> },
                { key: 'gantt', label: <span><BarChartOutlined />甘特图 (Alpha)</span> },
            ]}
            style={{ marginBottom: -16 }} // Adjust for Tab's default margin
        />
        <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
            style={{ borderRadius: 8, height: 40, padding: '0 20px' }}
        >
          新建任务
        </Button>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'table' && <TaskTable tasks={tasks} columns={columns} />}
        {activeTab === 'kanban' && <TaskKanban tasks={tasks} onEdit={handleEdit} onDragEnd={onDragEnd} />}
        {activeTab === 'gantt' && (
            <Card style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <BarChartOutlined style={{ fontSize: 48, color: '#e5e7eb', marginBottom: 16 }} />
                    <div style={{ color: '#9ca3af' }}>甘特图功能开发中...</div>
                </div>
            </Card>
        )}
      </div>

      <Modal
        title={editingTask ? '编辑任务' : '新建任务'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        style={{ top: 40 }}
        styles={{ body: { padding: 24 } }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input size="large" placeholder="要做什么？" />
          </Form.Item>
          
          <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item name="type" label="类型" initialValue="study" style={{ flex: 1 }}>
                <Select size="large">
                  <Option value="study">学习</Option>
                  <Option value="life">生活</Option>
                  <Option value="habit">习惯</Option>
                </Select>
              </Form.Item>
              <Form.Item name="status" label="状态" initialValue="todo" style={{ flex: 1 }}>
                 <Select size="large">
                  <Option value="todo">待办</Option>
                  <Option value="in_progress">进行中</Option>
                  <Option value="done">已完成</Option>
                </Select>
              </Form.Item>
              <Form.Item name="dueDate" label="截止日期" rules={[{ required: true, message: '请选择日期' }]} style={{ flex: 1 }}>
                <DatePicker style={{ width: '100%' }} size="large" />
              </Form.Item>
          </div>
          
          <Form.Item name="isDailyPlan" valuePropName="checked" initialValue={false}>
             <Checkbox>加入今日计划</Checkbox>
          </Form.Item>
          
          <Form.Item label="任务描述 (Markdown)">
            <MarkdownEditor
                value={description}
                onChange={(val) => setDescription(val || '')}
                height={300}
                preview="edit"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskManager;
