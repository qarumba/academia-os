import React, { useEffect } from 'react';
import { Alert, Button, Modal } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsModelConfigured, loadConfigFromStorage } from './modelSlice';
import ModelConfiguration from './ModelConfiguration';

interface ModelConfigurationGuardProps {
  children: React.ReactNode;
  requireConfiguration?: boolean;
}

const ModelConfigurationGuard: React.FC<ModelConfigurationGuardProps> = ({ 
  children, 
  requireConfiguration = true 
}) => {
  const dispatch = useDispatch();
  const isConfigured = useSelector(selectIsModelConfigured);
  const [showConfigModal, setShowConfigModal] = React.useState(false);

  useEffect(() => {
    // Try to load configuration from storage on mount
    dispatch(loadConfigFromStorage());
  }, [dispatch]);

  useEffect(() => {
    // Show configuration modal if not configured and required
    if (requireConfiguration && !isConfigured) {
      setShowConfigModal(true);
    }
  }, [requireConfiguration, isConfigured]);

  const handleConfigurationComplete = () => {
    dispatch(loadConfigFromStorage());
    setShowConfigModal(false);
  };

  if (requireConfiguration && !isConfigured) {
    return (
      <>
        <Alert
          message="Model Configuration Required"
          description="Please configure your AI model to use Academia OS features."
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          action={
            <Button type="primary" onClick={() => setShowConfigModal(true)}>
              Configure Model
            </Button>
          }
          style={{ marginBottom: 24 }}
        />
        
        <Modal
          title="Configure AI Model"
          open={showConfigModal}
          footer={null}
          width={800}
          onCancel={() => setShowConfigModal(false)}
        >
          <ModelConfiguration />
        </Modal>
      </>
    );
  }

  return <>{children}</>;
};

export default ModelConfigurationGuard;
