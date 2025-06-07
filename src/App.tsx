import { Button, ConfigProvider, theme, App as AntApp } from "antd"
import React from "react"
import { Root } from "./Components/Root"
import { Provider } from "react-redux"
import store from "./Redux/store"
import { ThemeProvider, useTheme } from "./Providers/ThemeContext"
import ModelConfigurationGuard from './Components/ModelConfigurationGuard';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  )
}

const ThemedApp: React.FC = () => {
  const { theme: currentTheme } = useTheme()
  return (
    <Provider store={store}>
      <ConfigProvider
        theme={{
          algorithm:
            currentTheme === "light"
              ? theme.defaultAlgorithm
              : theme.darkAlgorithm,
        }}>
        <AntApp>
          <ModelConfigurationGuard requireConfiguration={true}>
            <Root />
          </ModelConfigurationGuard>
        </AntApp>
      </ConfigProvider>
    </Provider>
  )
}

export default App
