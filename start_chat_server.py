#!/usr/bin/env python3
"""
Simple script to start the chat server with better error handling
"""
import sys
import os
import subprocess

def main():
    # Change to backend/src directory
    backend_src = os.path.join(os.path.dirname(__file__), 'backend', 'src')
    if not os.path.exists(backend_src):
        print(f"Error: Backend source directory not found: {backend_src}")
        return 1
    
    os.chdir(backend_src)
    print(f"Changed to directory: {os.getcwd()}")
    
    # Check if ai_chat_server.py exists
    server_file = 'ai_chat_server.py'
    if not os.path.exists(server_file):
        print(f"Error: {server_file} not found in {os.getcwd()}")
        return 1
    
    print(f"Starting {server_file}...")
    
    try:
        # Run the server
        result = subprocess.run([sys.executable, server_file], check=True)
        return result.returncode
    except subprocess.CalledProcessError as e:
        print(f"Error running server: {e}")
        return e.returncode
    except KeyboardInterrupt:
        print("\nServer stopped by user")
        return 0

if __name__ == "__main__":
    sys.exit(main())
