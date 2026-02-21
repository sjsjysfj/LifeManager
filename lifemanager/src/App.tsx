import React, { useState } from 'react';
import { Layout, Menu, ConfigProvider, Avatar, Typography, Space } from 'antd';
import {
  CalendarOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import DailySummary from './pages/DailySummary';
import TaskManager from './pages/TaskManager';
import FocusTimer from './pages/FocusTimer';
import Statistics from './pages/Statistics';
import { themeConfig } from './theme';
import './index.css';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

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
  const [currentKey, setCurrentKey] = useState('1');
  const [collapsed, setCollapsed] = useState(false);

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

  const currentTitle = items.find(i => i.key === currentKey)?.label;

  return (
    <ConfigProvider theme={themeConfig}>
      <Layout style={{ height: '100vh', background: '#f3f4f6' }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          width={260}
          style={{
            boxShadow: '4px 0 15px rgba(0,0,0,0.05)',
            zIndex: 10,
            overflow: 'hidden',
          }}
          theme="dark"
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Logo Area */}
            <div style={{
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              marginBottom: 16,
              flexShrink: 0
            }}>
              <Space size={12} align="center">
                 <div style={{
                     width: 32,
                     height: 32,
                     background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                     borderRadius: 8,
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     color: 'white',
                     fontWeight: 'bold'
                 }}>
                     LM
                 </div>
                 {!collapsed && (
                     <span style={{ 
                         color: 'white', 
                         fontSize: 18, 
                         fontWeight: 600,
                         letterSpacing: '0.5px'
                     }}>
                         LifeManager
                     </span>
                 )}
              </Space>
            </div>
            
            {/* Menu Area - Flex Grow to take available space */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              <Menu
                theme="dark"
                mode="inline"
                defaultSelectedKeys={['1']}
                selectedKeys={[currentKey]}
                items={items.map(item => ({ key: item.key, icon: item.icon, label: item.label }))}
                onClick={(e) => setCurrentKey(e.key)}
                style={{ border: 'none', background: 'transparent' }}
              />
            </div>

            {/* User Profile Area - Fixed at bottom */}
            <div style={{
                padding: '24px',
                flexShrink: 0,
                marginBottom: 48 // Leave space for trigger
            }}>
                {collapsed ? (
                    <div style={{ textAlign: 'center' }}>
                         <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#6366f1' }} />
                    </div>
                ) : (
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: 12,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                    }}>
                        <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#6366f1' }} />
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>User</div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Pro Plan</div>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </Sider>
        
        <Layout style={{ background: '#f3f4f6' }}>
          <Header style={{ 
              padding: '0 32px', 
              background: 'transparent', 
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
          }}>
            <Title level={3} style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>
                {currentTitle}
            </Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                 <div style={{ color: '#6b7280', fontSize: 14 }}>
                    {new Date().toLocaleDateString()}
                 </div>
            </div>
          </Header>
          
          <Content style={{ 
              margin: '0 32px 32px', 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
          }}>
            <div style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: 8
            }}>
                {renderContent()}
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
