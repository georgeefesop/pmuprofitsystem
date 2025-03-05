#!/bin/bash
echo "Starting PMU Profit System development server..."

# Determine the operating system
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  open -a Terminal.app "$(pwd)/scripts/start-dev.js"
else
  # Linux and others
  if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- node "$(pwd)/scripts/start-dev.js"
  elif command -v xterm &> /dev/null; then
    xterm -e "node $(pwd)/scripts/start-dev.js" &
  else
    # Fallback to running in the current terminal
    node "$(pwd)/scripts/start-dev.js" &
  fi
fi

echo "Server started in a new window. You can continue using this terminal." 