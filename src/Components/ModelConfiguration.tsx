import React, { useState, useEffect } from 'react';
import { Form, Select, Input, Button, Card, message, Alert, Typography } from 'antd';
import { SettingOutlined, KeyOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Title, Paragraph } = Typography;

interface ModelConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
}

interface ModelOption {
  provider: 'openai' | 'anthropic';
  model: string;
  displayName: string;
  description: string;
}

const availableModels: ModelOption[] = [
  {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    displayName: 'Claude 3 Opus',
    description: 'Most powerful model for complex research tasks'
  },
  {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    displayName: 'Claude 3 Sonnet',
    description: 'Balanced performance and cost for general research'
  },
  {
    provider: 'openai',
    model: 'gpt-4',
    displayName: 'GPT-4',
    description: 'OpenAI\'s most capable model'
  },
  {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5 Turbo',
    description: 'Fast and cost-effective for simpler tasks'
  }
];

const ModelConfiguration: React.FC = () => {
  const [form] = Form.useForm();
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic'>('anthropic');
  const [loading, setLoading] = useState(false);

  // Load saved configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('modelConfig');
    if (savedConfig) {
      const config: ModelConfig = JSON.parse(savedConfig);
      form.setFieldsValue(config);
      setSelectedProvider(config.provider);
    }
  }, [form]);

  const handleProviderChange = (value: 'openai' | 'anthropic') => {
    setSelectedProvider(value);
    // Clear model selection when provider changes
    form.setFieldValue('model', undefined);
  };

  const handleSave = async (values: ModelConfig) => {
    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('modelConfig', JSON.stringify(values));
      
      // You would typically also send this to your backend or update your LangChain configuration
      // For now, we'll just save locally
      
      message.success('Model configuration saved successfully!');
    } catch (error) {
      message.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredModels = () => {
    return availableModels.filter(model => model.provider === selectedProvider);
  };

  return (
    <Card 
      title={
        <>
          <SettingOutlined /> Model Configuration
        </>
      }
      style={{ maxWidth: 800, margin: '0 auto' }}
    >
      <Alert
        message="Recommended: Use Claude 4 Sonnet or Claude 4 Opus"
        description="For the best academic research experience, we recommend using Anthropic's Claude models. Claude 4 Opus provides the most powerful capabilities for complex research tasks, while Claude 4 Sonnet offers a great balance of performance and cost."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229'
        }}
      >
        <Form.Item
          name="provider"
          label="Model Provider"
          rules={[{ required: true, message: 'Please select a provider' }]}
        >
          <Select
            size="large"
            onChange={handleProviderChange}
            placeholder="Select a provider"
          >
            <Option value="anthropic">Anthropic (Claude)</Option>
            <Option value="openai">OpenAI (GPT)</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="model"
          label="Model"
          rules={[{ required: true, message: 'Please select a model' }]}
        >
          <Select
            size="large"
            placeholder="Select a model"
          >
            {getFilteredModels().map(model => (
              <Option key={model.model} value={model.model}>
                <div>
                  <strong>{model.displayName}</strong>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {model.description}
                  </div>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="apiKey"
          label={
            <>
              <KeyOutlined /> API Key
            </>
          }
          rules={[
            { required: true, message: 'Please enter your API key' },
            { min: 20, message: 'API key seems too short' }
          ]}
          extra={
            selectedProvider === 'anthropic' 
              ? <span>Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">Anthropic Console</a></span>
              : <span>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI Platform</a></span>
          }
        >
          <Input.Password
            size="large"
            placeholder={`Enter your ${selectedProvider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API key`}
          />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            size="large" 
            loading={loading}
            block
          >
            Save Configuration
          </Button>
        </Form.Item>
      </Form>

      <div style={{ marginTop: 24, padding: 16, background: '#f0f2f5', borderRadius: 8 }}>
        <Title level={5}>Why Claude 4 for Academic Research?</Title>
        <Paragraph>
          <ul>
            <li><strong>Superior Context Understanding:</strong> Claude models excel at understanding complex academic papers and research contexts</li>
            <li><strong>Nuanced Analysis:</strong> Better at identifying subtle patterns and connections in qualitative research</li>
            <li><strong>Ethical Reasoning:</strong> Strong capabilities for handling sensitive research topics appropriately</li>
            <li><strong>Long Context Window:</strong> Can process longer documents and maintain coherence across extensive research materials</li>
          </ul>
        </Paragraph>
      </div>
    </Card>
  );
};

export default ModelConfiguration;
