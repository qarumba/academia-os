import React, { useState, useEffect, useCallback } from 'react';
import { Form, Select, Input, Button, Card, Alert, Typography, Row, Col, Divider, App, Switch } from 'antd';
import { SettingOutlined, KeyOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { setModelConfig, loadConfigFromStorage, selectIsModelConfigured } from './modelSlice';
import { ChatService } from '../Services/ChatService';

const { Option } = Select;
const { Title, Paragraph } = Typography;

interface ModelConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
  openaiEmbeddingsKey?: string;
  email?: string;
  adobePDFOCR_client_id?: string;
  adobePDFOCR_client_secret?: string;
  // LangFuse self-hosted configuration
  langfuseEnabled?: boolean;
  langfusePublicKey?: string;
  langfuseSecretKey?: string;
  langfuseHost?: string;
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
    model: 'claude-4-opus-20250514',
    displayName: 'Claude 4 Opus',
    description: 'Most powerful Claude model for complex reasoning and analysis'
  },
  {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    displayName: 'Claude 4 Sonnet',
    description: 'Smart, efficient Claude model with excellent performance and speed'
  },
  {
    provider: 'anthropic',
    model: 'claude-3-7-sonnet-20250109',
    displayName: 'Claude 3.7 Sonnet',
    description: 'Enhanced Claude 3 with improved reasoning and capabilities'
  },
  {
    provider: 'openai',
    model: 'gpt-4o',
    displayName: 'GPT-4o',
    description: 'Latest and most capable multimodal model (auto-updates to newest version)'
  },
  {
    provider: 'openai',
    model: 'gpt-4-turbo',
    displayName: 'GPT-4 Turbo',
    description: 'High-performance model with 128k context (auto-updates to latest)'
  },
  {
    provider: 'openai',
    model: 'gpt-4',
    displayName: 'GPT-4',
    description: 'Reliable and capable model (auto-updates to latest version)'
  }
];

const ModelConfiguration: React.FC = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic'>('anthropic');
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasEmbeddingsKey, setHasEmbeddingsKey] = useState(false);
  const [anthropicAvailable, setAnthropicAvailable] = useState<boolean | null>(null);
  const { message } = App.useApp();
  const isConfigured = useSelector(selectIsModelConfigured);

  // Check Anthropic availability
  useEffect(() => {
    ChatService.isAnthropicAvailable().then(setAnthropicAvailable);
  }, []);

  // Debug logging (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !isConfigured) {
      console.log('ModelConfiguration: isConfigured =', isConfigured);
      console.log('ModelConfiguration: anthropicAvailable =', anthropicAvailable);
    }
  }, [isConfigured, anthropicAvailable]);

  // Load saved configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('modelConfig');
    if (savedConfig) {
      const config: ModelConfig = JSON.parse(savedConfig);
      form.setFieldsValue(config);
      setSelectedProvider(config.provider);
      setHasEmbeddingsKey(!!config.openaiEmbeddingsKey);
      // Show advanced options if any advanced fields have values
      if (config.email || config.adobePDFOCR_client_id || config.adobePDFOCR_client_secret || 
          config.langfuseEnabled || config.langfusePublicKey || config.langfuseSecretKey || config.langfuseHost) {
        setShowAdvanced(true);
      }
    }
  }, [form]);

  const handleProviderChange = useCallback((value: 'openai' | 'anthropic') => {
    setSelectedProvider(value);
    // Clear model selection when provider changes
    form.setFieldValue('model', undefined);
  }, [form]);

  const handleSave = async (values: ModelConfig) => {
    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('modelConfig', JSON.stringify(values));
      
      // Update Redux state
      dispatch(setModelConfig(values));
      
      message.success('Model configuration saved successfully!');
      
      // Reload config to update the guard
      dispatch(loadConfigFromStorage());
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
      {!isConfigured && (
        <Alert
          message="Configuration Required"
          description="Please configure your AI model to continue using Academia OS features."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
      
      {isConfigured && (
        <>
          {selectedProvider === 'anthropic' ? (
            <Alert
              message="✅ Anthropic Claude Configuration Complete"
              description={
                <div>
                  <strong>Status:</strong> Your Anthropic API key is configured and ready to use.
                  <br />
                  <strong>Current Setup:</strong> {anthropicAvailable 
                    ? "Native Anthropic integration via @langchain/anthropic package." 
                    : "Graceful fallback mode - your Anthropic models will work via compatibility layer."}
                  <br />
                  <strong>Ready to use:</strong> All qualitative analysis features (Coding, Modeling) will respect your Anthropic model choice.
                  {!anthropicAvailable && (
                    <>
                      <br />
                      <em>Note: Using compatibility layer. Restart the application to enable native Anthropic integration.</em>
                    </>
                  )}
                </div>
              }
              type={anthropicAvailable ? "success" : "warning"}
              showIcon
              style={{ marginBottom: 24 }}
            />
          ) : (
            <Alert
              message="AI Models Configured Successfully"
              description="Primary AI Model (OpenAI) and Embeddings AI Model are configured."
              type="success"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}
        </>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          provider: 'openai',
          model: 'gpt-4o'
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
            popupMatchSelectWidth={false}
            styles={{
              popup: {
                root: { maxHeight: 400, overflow: 'auto' }
              }
            }}
            optionLabelProp="label"
          >
            {getFilteredModels().map(model => (
              <Option key={model.model} value={model.model} label={model.displayName}>
                <div style={{ lineHeight: '1.4', padding: '4px 0' }}>
                  <strong>{model.displayName}</strong>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666',
                    marginTop: '2px',
                    whiteSpace: 'normal',
                    wordWrap: 'break-word',
                    lineHeight: '1.3'
                  }}>
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
            { min: 10, message: 'API key seems too short' }
          ]}
        >
          <Input.Password
            size="large"
            placeholder={`Enter your ${selectedProvider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API key`}
          />
        </Form.Item>

        {selectedProvider === 'anthropic' && (
          <>
            {!hasEmbeddingsKey && (
              <Alert
                message="OpenAI API Key for Embeddings"
                description="Anthropic doesn't provide embeddings API yet. An OpenAI API key is required for paper ranking and similarity features when using Anthropic models."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            
            <Form.Item
              name="openaiEmbeddingsKey"
              label="OpenAI API Key (for Embeddings)"
              extra="Required for paper ranking and similarity search when using Anthropic models."
            >
              <Input.Password
                size="large"
                placeholder="OpenAI API key for embeddings"
                onChange={(e) => setHasEmbeddingsKey(!!e.target.value)}
              />
            </Form.Item>
          </>
        )}

        <Divider orientation="left">
          <Button 
            type="link" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{ padding: 0 }}
          >
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </Button>
        </Divider>

        {showAdvanced && (
          <>
            <Divider orientation="left" plain>
              <DatabaseOutlined /> LangFuse Self-Hosted Observatory
            </Divider>

            <Form.Item
              name="langfuseEnabled"
              label="Enable LangFuse Observability"
              valuePropName="checked"
              extra={
                <span>
                  Enable{' '}
                  <Typography.Link
                    target="_blank"
                    href="https://langfuse.com/"
                  >
                    LangFuse
                  </Typography.Link>{' '}
                  for self-hosted AI model observability with privacy-preserving analytics.
                </span>
              }
            >
              <Switch />
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, curValues) => prevValues.langfuseEnabled !== curValues.langfuseEnabled}
            >
              {({ getFieldValue }) => {
                const langfuseEnabled = getFieldValue('langfuseEnabled');
                return langfuseEnabled ? (
                  <>
                    <Form.Item
                      name="langfuseHost"
                      label="LangFuse Host URL"
                      extra="URL of your self-hosted LangFuse instance"
                      rules={[
                        { required: langfuseEnabled, message: 'Host URL is required when LangFuse is enabled' },
                        { type: 'url', message: 'Please enter a valid URL' }
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder="http://localhost:3030"
                      />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="langfusePublicKey"
                          label="LangFuse Public Key"
                          extra="Public key for your LangFuse project"
                          rules={[
                            { required: langfuseEnabled, message: 'Public key is required when LangFuse is enabled' }
                          ]}
                        >
                          <Input
                            size="large"
                            placeholder="pk-lf-..."
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="langfuseSecretKey"
                          label="LangFuse Secret Key"
                          extra="Secret key for your LangFuse project"
                          rules={[
                            { required: langfuseEnabled, message: 'Secret key is required when LangFuse is enabled' }
                          ]}
                        >
                          <Input.Password
                            size="large"
                            placeholder="sk-lf-..."
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Alert
                      message="Privacy & Security"
                      description="LangFuse runs on your own infrastructure, ensuring complete data privacy and compliance with academic research requirements. All AI model interactions are traced locally."
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  </>
                ) : null;
              }}
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="adobePDFOCR_client_id"
                  label="Adobe OCR Client ID"
                  extra={
                    <span>
                      Use{' '}
                      <Typography.Link
                        target="_blank"
                        href="https://developer.adobe.com/document-services/docs/overview/pdf-services-api/gettingstarted/"
                      >
                        Adobe PDF Services
                      </Typography.Link>{' '}
                      to read scanned PDFs.
                    </span>
                  }
                >
                  <Input
                    size="large"
                    placeholder="Adobe OCR Client ID (optional)"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="adobePDFOCR_client_secret"
                  label="Adobe OCR Client Secret"
                >
                  <Input.Password
                    size="large"
                    placeholder="Adobe OCR Client Secret (optional)"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="email"
              label="Thomas Üllebecker's Academia-OS Project Updates"
              extra="Optional: Subscribe to Thomas Üllebecker's updates on original Academia-OS."
            >
              <Input
                size="large"
                placeholder="your.email@example.com (optional)"
              />
            </Form.Item>
          </>
        )}

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
    </Card>
  );
};

export default ModelConfiguration;
