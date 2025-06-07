import React, { useState, useEffect, useCallback } from 'react';
import { 
  Drawer, 
  Card, 
  Statistic, 
  Space, 
  Button, 
  Alert,
  Row,
  Col,
  Tag,
  Typography
} from 'antd';
import { 
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloudOutlined,
  BranchesOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import { LangfuseService } from '../Services/LangfuseService';

const { Text, Title } = Typography;

interface LangfuseMonitorProps {
  visible: boolean;
  onClose: () => void;
  isProcessing: boolean;
  currentOperation?: string;
}

export const LangfuseMonitor: React.FC<LangfuseMonitorProps> = ({
  visible,
  onClose,
  isProcessing,
  currentOperation
}) => {
  const [connectionTest, setConnectionTest] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const result = await LangfuseService.testConnection();
      setConnectionTest(result);
    } catch (error) {
      setConnectionTest({
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (visible && LangfuseService.isLangfuseConfigured()) {
      testConnection();
    }
  }, [visible]);

  if (!LangfuseService.isLangfuseConfigured()) {
    return (
      <Drawer
        title="LLM Tracing & Evaluation"
        placement="right"
        onClose={onClose}
        open={visible}
        width={400}
      >
        <Alert
          message="Langfuse Not Configured"
          description="Enable Langfuse in model configuration to access advanced LLM tracing, evaluation, and debugging capabilities."
          type="info"
          showIcon
        />
        
        <Card style={{ marginTop: 16 }}>
          <Title level={5}>Langfuse Features</Title>
          <Space direction="vertical" size="small">
            <div><BranchesOutlined /> <Text>End-to-end workflow tracing</Text></div>
            <div><ExperimentOutlined /> <Text>LLM response evaluation</Text></div>
            <div><CloudOutlined /> <Text>Prompt management & versioning</Text></div>
            <div><EyeOutlined /> <Text>Advanced analytics & debugging</Text></div>
          </Space>
        </Card>
      </Drawer>
    );
  }

  return (
    <Drawer
      title="Langfuse Tracing Monitor"
      placement="right"
      onClose={onClose}
      open={visible}
      width={400}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Connection Status */}
        <Card>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Title level={5}>Connection Status</Title>
            <Button 
              onClick={testConnection} 
              loading={loading} 
              type="primary" 
              block
              icon={<CloudOutlined />}
            >
              Test Langfuse Connection
            </Button>
            
            {connectionTest && (
              <Alert
                message={connectionTest.success ? "Connection Successful" : "Connection Failed"}
                description={connectionTest.message}
                type={connectionTest.success ? "success" : "error"}
                showIcon
                icon={connectionTest.success ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
              />
            )}
          </Space>
        </Card>

        {/* Current Session */}
        <Card>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Title level={5}>Current Session</Title>
            <Row gutter={16}>
              <Col span={24}>
                <Statistic
                  title="Session Status"
                  value={isProcessing ? "Processing" : "Idle"}
                  prefix={isProcessing ? <BranchesOutlined spin /> : <CheckCircleOutlined />}
                />
              </Col>
            </Row>
            
            {currentOperation && (
              <div>
                <Text strong>Current Operation:</Text>
                <br />
                <Tag color="processing">{currentOperation}</Tag>
              </div>
            )}
          </Space>
        </Card>

        {/* Features Info */}
        <Card>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Title level={5}>Active Features</Title>
            <Space direction="vertical" size="small">
              <Tag color="green" icon={<BranchesOutlined />}>
                Workflow Tracing
              </Tag>
              <Tag color="blue" icon={<ExperimentOutlined />}>
                Generation Logging
              </Tag>
              <Tag color="purple" icon={<EyeOutlined />}>
                Error Tracking
              </Tag>
            </Space>
            
            <Alert
              message="Automatic Tracing Active"
              description="Langfuse is automatically tracking your academic workflows including Gioia method coding, theory development, and literature analysis."
              type="info"
              showIcon
            />
          </Space>
        </Card>

        {/* Quick Actions */}
        <Card>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Title level={5}>Quick Actions</Title>
            <Button 
              block 
              onClick={() => LangfuseService.flush()}
              icon={<CloudOutlined />}
            >
              Flush Observations
            </Button>
            
            <Alert
              message="View Detailed Analytics"
              description={
                <span>
                  Visit your{' '}
                  <a 
                    href="https://cloud.langfuse.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Langfuse Dashboard
                  </a>{' '}
                  to see detailed traces, evaluate outputs, and analyze your research workflows.
                </span>
              }
              type="info"
              showIcon
            />
          </Space>
        </Card>
      </Space>
    </Drawer>
  );
};

export default LangfuseMonitor;