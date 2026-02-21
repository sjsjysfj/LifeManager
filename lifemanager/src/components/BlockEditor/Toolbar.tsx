import React from 'react';
import { 
  BoldOutlined, 
  UnorderedListOutlined, 
  OrderedListOutlined, 
  CheckSquareOutlined, 
  FileImageOutlined,
  FontSizeOutlined
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import type { BlockType } from '../../utils/markdownUtils';

interface ToolbarProps {
  onToggleType: (type: BlockType) => void;
  onToggleBold: () => void;
  onAddImage: () => void;
  currentType: BlockType | null;
}

const Toolbar: React.FC<ToolbarProps> = ({ onToggleType, onToggleBold, onAddImage, currentType }) => {
  return (
    <div className="block-editor-toolbar" style={{ 
      padding: '8px', 
      borderBottom: '1px solid #eee', 
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '4px'
    }}>
      <Tooltip title="普通文本 (Normal Text)">
        <Button 
          icon={<FontSizeOutlined />} 
          onClick={() => onToggleType('p')} 
          type={currentType === 'p' ? 'primary' : 'text'}
        />
      </Tooltip>
      <Tooltip title="加粗 (Bold) Ctrl+B">
        <Button 
          icon={<BoldOutlined />} 
          onClick={onToggleBold} 
          type="text" 
        />
      </Tooltip>
      
      <div style={{ width: 1, height: 20, background: '#eee', margin: '0 8px' }} />

      <Tooltip title="一级标题 (Heading 1)">
        <Button 
          onClick={() => onToggleType('h1')} 
          type={currentType === 'h1' ? 'primary' : 'text'}
        >H1</Button>
      </Tooltip>
      <Tooltip title="二级标题 (Heading 2)">
        <Button 
          onClick={() => onToggleType('h2')} 
          type={currentType === 'h2' ? 'primary' : 'text'}
        >H2</Button>
      </Tooltip>
      <Tooltip title="三级标题 (Heading 3)">
        <Button 
          onClick={() => onToggleType('h3')} 
          type={currentType === 'h3' ? 'primary' : 'text'}
        >H3</Button>
      </Tooltip>

      <div style={{ width: 1, height: 20, background: '#eee', margin: '0 8px' }} />

      <Tooltip title="无序列表 (Bullet List)">
        <Button 
          icon={<UnorderedListOutlined />} 
          onClick={() => onToggleType('ul')} 
          type={currentType === 'ul' ? 'primary' : 'text'}
        />
      </Tooltip>
      <Tooltip title="有序列表 (Ordered List)">
        <Button 
          icon={<OrderedListOutlined />} 
          onClick={() => onToggleType('ol')} 
          type={currentType === 'ol' ? 'primary' : 'text'}
        />
      </Tooltip>
      <Tooltip title="复选框 (Checkbox)">
        <Button 
          icon={<CheckSquareOutlined />} 
          onClick={() => onToggleType('checkbox')} 
          type={currentType === 'checkbox' ? 'primary' : 'text'}
        />
      </Tooltip>

      <div style={{ width: 1, height: 20, background: '#eee', margin: '0 8px' }} />

      <Tooltip title="插入图片 (Image)">
        <Button 
          icon={<FileImageOutlined />} 
          onClick={onAddImage} 
          onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
          type="text"
        />
      </Tooltip>
    </div>
  );
};

export default Toolbar;
