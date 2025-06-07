import React, { useState, useEffect } from 'react';
import { 
  Drawer, 
  Card, 
  Statistic, 
  Space, 
  List, 
  Tag, 
  Button, 
  Tooltip,
  Row,
  Col,
  Progress,
  Alert
} from 'antd';
import { 
  DollarOutlined, 
  CloudOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { HeliconeService } from '../Services/HeliconeService';

interface HeliconeMonitorProps {
  visible: boolean;
  onClose: () => void;
  isProcessing: boolean;
  currentOperation?: string;
}

export const HeliconeMonitor: React.FC<HeliconeMonitorProps> = ({
  visible,
  onClose,
  isProcessing,
  currentOperation
}) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sessionStartTime] = useState(HeliconeService.getSessionStartTime() || new Date());

  useEffect(() => {
    if (visible && HeliconeService.isHeliconeConfigured()) {
      fetchStats();
      // Refresh every 10 seconds during processing
      const interval = isProcessing ? setInterval(fetchStats, 10000) : null;
      return () => { if (interval) clearInterval(interval); };
    }
  }, [visible, isProcessing]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const sessionStats = await HeliconeService.getSessionStats(sessionStartTime);
      setStats(sessionStats);
    } catch (error) {
      console.error('Failed to fetch Helicone stats:', error);
    }
    setLoading(false);
  };

  if (!HeliconeService.isHeliconeConfigured()) {
    return (
      <Drawer
        title="API Monitoring"
        placement="right"
        onClose={onClose}
        open={visible}
        width={400}
      >
        <Alert
          message="Helicone Not Configured"
          description="Enable Helicone monitoring in model configuration to track API costs and usage."
          type="info"
          showIcon
        />
      </Drawer>
    );
  }

  return (
    <Drawer
      title={
        <Space>
          <BarChartOutlined />
          API Monitoring
          {isProcessing && <Tag color="processing">Live</Tag>}
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={400}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        
        {/* Current Operation */}
        {isProcessing && currentOperation && (
          <Card size="small">
            <Space>
              <ClockCircleOutlined spin />
              <span>{currentOperation}</span>
            </Space>
          </Card>
        )}

        {/* Session Statistics */}
        <Card title="Session Summary" size="small">
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Total Cost"
                value={stats?.total_cost || 0}
                precision={4}
                prefix={<DollarOutlined />}
                suffix="USD"
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Requests"
                value={stats?.total_requests || 0}
                prefix={<CloudOutlined />}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Statistic
                title="Tokens Used"
                value={stats?.total_tokens || 0}
                formatter={(value) => `${Number(value).toLocaleString()}`}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Success Rate"
                value={(stats?.success_rate || 0) * 100}
                precision={1}
                suffix="%"
                prefix={<CheckCircleOutlined />}
              />
            </Col>
          </Row>
        </Card>

        {/* Cost Tracking Progress */}
        <Card title="Cost Tracking" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <span>Session Budget Progress</span>
              <Progress 
                percent={Math.min((stats?.total_cost || 0) / 5.0 * 100, 100)} 
                status={stats?.total_cost > 5.0 ? "exception" : "active"}
                format={() => `$${(stats?.total_cost || 0).toFixed(4)}`}
              />
            </div>
            <Tooltip title="Estimated cost per request">
              <span>
                Avg. Cost/Request: ${((stats?.total_cost || 0) / Math.max(stats?.total_requests || 1, 1)).toFixed(4)}
              </span>
            </Tooltip>
          </Space>
        </Card>

        {/* Recent Requests */}
        <Card title="Recent API Calls" size="small">
          <List
            dataSource={stats?.recent_requests || []}
            renderItem={(request: any) => (
              <List.Item>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space>
                    <Tag color={request.status === 'success' ? 'green' : 'red'}>
                      {request.model}
                    </Tag>
                    <span>${(request.cost || 0).toFixed(4)}</span>
                  </Space>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {request.total_tokens} tokens • {new Date(request.created_at).toLocaleTimeString()}
                  </span>
                </Space>
              </List.Item>
            )}
            loading={loading}
            size="small"
          />
        </Card>

        {/* Controls */}
        <Card size="small">
          <Space>
            <Button onClick={fetchStats} loading={loading}>
              Refresh
            </Button>
            <Button 
              onClick={() => HeliconeService.startSession()} 
              type="dashed"
            >
              Reset Session
            </Button>
          </Space>
        </Card>

      </Space>
    </Drawer>
  );
};