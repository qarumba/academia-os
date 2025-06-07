import React from 'react';
import { Card, Skeleton, Space, Typography, Spin } from 'antd';
import { SearchOutlined, LoadingOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface SearchLoadingStateProps {
  searchQuery?: string;
  stage?: 'searching' | 'processing' | 'ranking';
}

const SearchLoadingState: React.FC<SearchLoadingStateProps> = ({ 
  searchQuery, 
  stage = 'searching' 
}) => {
  const getStageMessage = () => {
    switch (stage) {
      case 'searching':
        return 'Searching academic papers on Semantic Scholar...';
      case 'processing':
        return 'Processing and analyzing papers...';
      case 'ranking':
        return 'Ranking papers by relevance...';
      default:
        return 'Searching academic papers...';
    }
  };

  const getStageDescription = () => {
    switch (stage) {
      case 'searching':
        return 'Querying thousands of academic papers to find the most relevant results';
      case 'processing':
        return 'Extracting abstracts and metadata from discovered papers';
      case 'ranking':
        return 'Using AI to rank papers by relevance to your research question';
      default:
        return 'Please wait while we find relevant academic papers';
    }
  };

  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      {/* Loading Header */}
      <div style={{ marginBottom: '40px' }}>
        <Spin 
          indicator={<LoadingOutlined style={{ fontSize: 32, color: '#1890ff' }} />}
          style={{ marginBottom: '16px' }}
        />
        <Title level={3} style={{ margin: '16px 0 8px 0' }}>
          {getStageMessage()}
        </Title>
        {searchQuery && (
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Query: "<strong>{searchQuery}</strong>"
          </Text>
        )}
        <br />
        <Text type="secondary" style={{ fontSize: '14px', marginTop: '8px', display: 'block' }}>
          {getStageDescription()}
        </Text>
      </div>

      {/* Skeleton Paper Cards */}
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Title level={4} style={{ textAlign: 'left', marginBottom: '20px' }}>
          <SearchOutlined /> Found Papers (Loading...)
        </Title>
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {[1, 2, 3, 4, 5].map((index) => (
            <Card 
              key={index}
              style={{ 
                textAlign: 'left',
                opacity: 1 - (index * 0.15) // Fade effect for depth
              }}
            >
              <Skeleton 
                active 
                title={{ width: '80%' }}
                paragraph={{ 
                  rows: 3, 
                  width: ['100%', '95%', '60%'] 
                }}
              >
                <div style={{ marginTop: '12px' }}>
                  <Skeleton.Button size="small" style={{ marginRight: '8px' }} />
                  <Skeleton.Button size="small" style={{ marginRight: '8px' }} />
                  <Skeleton.Button size="small" />
                </div>
              </Skeleton>
            </Card>
          ))}
        </Space>

        {/* Progress Dots */}
        <div style={{ marginTop: '30px' }}>
          <Space>
            {[1, 2, 3].map((dot) => (
              <div
                key={dot}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#1890ff',
                  animation: `pulse 1.5s infinite ${dot * 0.2}s`,
                }}
              />
            ))}
          </Space>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          30% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
};

export default SearchLoadingState;