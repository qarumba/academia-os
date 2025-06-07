import React from 'react';
import { Space, Typography, Divider, theme } from 'antd';
import { SlackOutlined, GithubOutlined } from '@ant-design/icons';

const { Text, Link } = Typography;

const Footer: React.FC = () => {
  const { token } = theme.useToken();
  
  return (
    <footer style={{ 
      padding: '24px 0', 
      textAlign: 'center',
      borderTop: `1px solid ${token.colorBorderSecondary}`,
      marginTop: '40px',
      backgroundColor: token.colorBgLayout
    }}>
      <Space split={<Divider type="vertical" />} size="large">
        <Link
          href="https://join.slack.com/t/academiaos/shared_invite/zt-23730lsp0-Qlkv_0Bs3hgMY2FGTC~HnQ"
          target="_blank"
          rel="noopener noreferrer"
        >
          <SlackOutlined /> Slack Community
        </Link>
        
        <Link
          href="https://github.com/thomasuebi/academia-os"
          target="_blank"
          rel="noopener noreferrer"
        >
          <GithubOutlined /> AcademiaOS 1.0 GitHub
        </Link>
        
        <Link
          href="https://github.com/qarumba/academia-os"
          target="_blank"
          rel="noopener noreferrer"
        >
          <GithubOutlined /> AcademiaOS 2.0 (Fork)
        </Link>
      </Space>
      
      <div style={{ marginTop: '16px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Original Academia-OS by Thomas Üllebecker
        </Text>
      </div>
    </footer>
  );
};

export default Footer;