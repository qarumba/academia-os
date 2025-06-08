#!/bin/bash
# Start Browser Tools MCP Server
echo "Starting Browser Tools Server..."
npx @agentdeskai/browser-tools-server@latest &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Wait for server to start
sleep 3

echo "Server started on http://localhost:3025"
echo "To stop the server, run: kill $SERVER_PID"