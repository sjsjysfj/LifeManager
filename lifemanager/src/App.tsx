import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  CalendarOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import DailySummary from './pages/DailySummary';
import TaskManager from './pages/TaskManager';
import FocusTimer from './pages/FocusTimer';
import Statistics from './pages/Statistics';

const { Header, Content, Footer, Sider } = Layout;

type MenuItem = {
  key: string;
  icon?: React.ReactNode;
  label: React.ReactNode;
  component: React.ReactNode;
};

const items: MenuItem[] = [
  {
    key: '1',
    icon: <CalendarOutlined />,
    label: '每日总结',
    component: <DailySummary />,
  },
  {
    key: '2',
    icon: <CheckSquareOutlined />,
    label: '任务管理',
    component: <TaskManager />,
  },
  {
    key: '3',
    icon: <ClockCircleOutlined />,
    label: '专注时钟',
    component: <FocusTimer />,
  },
  {
    key: '4',
    icon: <BarChartOutlined />,
    label: '数据统计',
    component: <Statistics />,
  },
];

const App: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [currentKey, setCurrentKey] = useState('1');

  const renderContent = () => {
    switch (currentKey) {
        case '1':
            return <DailySummary onNavigate={(key) => setCurrentKey(key)} />;
        case '2':
            return <TaskManager />;
        case '3':
            return <FocusTimer />;
        case '4':
            return <Statistics />;
        default:
            return <DailySummary onNavigate={(key) => setCurrentKey(key)} />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div style={{
          height: 32,
          margin: 16,
          background: 'rgba(255, 255, 255, 0.2)',
          textAlign: 'center',
          lineHeight: '32px',
          color: '#fff',
          fontWeight: 'bold'
        }}>
          LifeManager
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          selectedKeys={[currentKey]}
          items={items.map(item => ({ key: item.key, icon: item.icon, label: item.label }))}
          onClick={(e) => setCurrentKey(e.key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer, textAlign: 'center', fontSize: '1.2em', fontWeight: 500 }}>
          {items.find(i => i.key === currentKey)?.label}
        </Header>
        <Content style={{ margin: '24px 16px 0' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              height: '100%',
              overflowY: 'auto'
            }}
          >
            {renderContent()}
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          LifeManager ©{new Date().getFullYear()} Created by Claude Code
        </Footer>
      </Layout>
    </Layout>
  );
};

export default App;
