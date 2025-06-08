import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  Divider
} from 'antd';
import { 
  DollarOutlined, 
  CloudOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  SecurityScanOutlined
} from '@ant-design/icons';
import { ChatService } from '../Services/ChatService';

interface LangFuseMonitorProps {
  visible: boolean;
  onClose: () => void;
  isProcessing: boolean;
  currentOperation?: string;
}

interface ModelMetric {
  model_name: string;
  request_count: number;
  total_cost: number;
  avg_latency: number;
}

interface AcademicStats {
  timeframe: string;
  total_research_sessions: number;
  institutional_cost: number;
  data_privacy_score: number;
  model_usage: Array<{ model: string; count: number }>;
  cost_breakdown: Array<{ model: string; cost: number }>;
  active_models: string[];
  generated_at: string;
}

export const LangFuseMonitor: React.FC<LangFuseMonitorProps> = ({
  visible,
  onClose,
  isProcessing,
  currentOperation
}) => {
  const [modelMetrics, setModelMetrics] = useState<ModelMetric[]>([]);
  const [academicStats, setAcademicStats] = useState<AcademicStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectionTest, setConnectionTest] = useState<{ success: boolean; message: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      // Parallel fetch of metrics and academic stats
      const [metricsResponse, statsResponse] = await Promise.all([
        fetch('http://localhost:3001/api/langfuse/model-metrics?timeframe=24h'),
        fetch('http://localhost:3001/api/langfuse/academic-stats?timeframe=30d')
      ]);

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setModelMetrics(metricsData.data || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setAcademicStats(statsData);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch LangFuse metrics:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (visible && ChatService.isLangFuseAvailable()) {
      fetchMetrics();
      // Refresh every 15 seconds during processing
      const interval = isProcessing ? setInterval(fetchMetrics, 15000) : null;
      return () => { if (interval) clearInterval(interval); };
    }
  }, [visible, isProcessing, fetchMetrics]);

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/langfuse/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const result = await response.json();
      setConnectionTest(result);
    } catch (error) {
      setConnectionTest({
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
    setLoading(false);
  };

  const langfuseStatus = ChatService.getLangFuseStatus();

  if (!langfuseStatus.packageAvailable || !langfuseStatus.configEnabled) {
    return (
      <Drawer
        title="AI Model Observatory"
        placement="right"
        onClose={onClose}
        open={visible}
        width={450}
      >
        <Alert
          message="LangFuse Not Configured"
          description="Enable LangFuse observability in model configuration to track AI usage, costs, and academic research metrics with self-hosted privacy."
          type="info"
          showIcon
        />
      </Drawer>
    );
  }

  const totalCost = academicStats?.institutional_cost || 0;
  const totalSessions = academicStats?.total_research_sessions || 0;

  return (
    <Drawer
      title={
        <Space>
          <DatabaseOutlined />
          AI Model Observatory
          {isProcessing && <Tag color="processing">Live</Tag>}
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={450}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        
        {/* Connection Status */}
        {!langfuseStatus.handlerInitialized && (
          <Alert
            message="Self-Hosted LangFuse"
            description={`Connecting to ${langfuseStatus.baseUrl}. Ensure your self-hosted LangFuse instance is running for full observability.`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        
        {/* Current Operation */}
        {isProcessing && currentOperation && (
          <Card size="small">
            <Space>
              <ClockCircleOutlined spin />
              <span>{currentOperation}</span>
            </Space>
          </Card>
        )}

        {/* Academic Research Summary */}
        <Card title="Research Session Summary" size="small">
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Institutional Cost"
                value={totalCost}
                precision={4}
                prefix={<DollarOutlined />}
                suffix="USD"
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Research Sessions"
                value={totalSessions}
                prefix={<CloudOutlined />}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Statistic
                title="Data Privacy"
                value={academicStats?.data_privacy_score || 100}
                suffix="%"
                prefix={<SecurityScanOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Active Models"
                value={academicStats?.active_models?.length || 0}
                prefix={<BarChartOutlined />}
              />
            </Col>
          </Row>
        </Card>

        {/* Model Usage Breakdown */}
        <Card title="Model Usage (24h)" size="small">
          <List
            dataSource={modelMetrics}
            renderItem={(metric: ModelMetric) => (
              <List.Item>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Tag color={metric.model_name.includes('gpt') ? 'blue' : 'purple'}>
                      {metric.model_name}
                    </Tag>
                    <span>${metric.total_cost.toFixed(4)}</span>
                  </Space>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {metric.request_count} requests
                    </span>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      Avg: ${(metric.total_cost / Math.max(metric.request_count, 1)).toFixed(4)}/req
                    </span>
                  </Space>
                </Space>
              </List.Item>
            )}
            loading={loading}
            size="small"
            locale={{ emptyText: 'No usage data available' }}
          />
        </Card>

        {/* Budget Tracking */}
        <Card title="Academic Budget Tracking" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <span>Research Budget Usage</span>
              <Progress 
                percent={Math.min(totalCost / 10.0 * 100, 100)} 
                status={totalCost > 10.0 ? "exception" : "active"}
                format={() => `$${totalCost.toFixed(4)}`}
              />
            </div>
            <Tooltip title="Average cost per research session">
              <span>
                Avg. Cost/Session: ${(totalCost / Math.max(totalSessions, 1)).toFixed(4)}
              </span>
            </Tooltip>
          </Space>
        </Card>

        {/* Privacy & Compliance */}
        <Card title="Privacy & Compliance" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>Deployment Type:</span>
              <Tag color="green">Self-Hosted</Tag>
            </Space>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>Data Classification:</span>
              <Tag color="blue">Academic Research</Tag>
            </Space>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>IRB Compliance:</span>
              <Tag color="cyan">Institutional</Tag>
            </Space>
          </Space>
        </Card>

        {/* Connection Test Results */}
        {connectionTest && (
          <Card size="small">
            <Alert
              message={connectionTest.success ? "Self-Hosted LangFuse Connected" : "Connection Test Failed"}
              description={connectionTest.message}
              type={connectionTest.success ? "success" : "error"}
              showIcon
            />
          </Card>
        )}

        <Divider />

        {/* Controls */}
        <Card size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <Button onClick={fetchMetrics} loading={loading}>
                Refresh Metrics
              </Button>
              <Button 
                onClick={testConnection} 
                loading={loading}
                type="default"
              >
                Test Connection
              </Button>
            </Space>
            {lastUpdated && (
              <span style={{ fontSize: '12px', color: '#666' }}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </Space>
        </Card>

      </Space>
    </Drawer>
  );
};