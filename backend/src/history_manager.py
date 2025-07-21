"""
History Manager for AI Assistant
Manages conversation history and search records
"""
import json
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class HistoryRecord(BaseModel):
    """Single history record"""
    id: str
    session_id: str
    timestamp: datetime
    service_type: str  # "ai_chat" or "ai_search"
    query: str
    response: str
    provider_used: str
    model_used: Optional[str] = None

class HistoryManager:
    """Manages conversation history"""

    def __init__(self, history_file: str = "data/conversation_history.json"):
        self.history_file = os.path.join(os.path.dirname(__file__), history_file)
        self.history: List[Dict[str, Any]] = []
        self._sessions_cache = None
        self._cache_timestamp = 0
        self.load_history()
    
    def load_history(self):
        """Load history from file"""
        try:
            if os.path.exists(self.history_file):
                with open(self.history_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.history = data.get('records', [])
                    print(f"[HISTORY] Loaded {len(self.history)} records")
            else:
                self.history = []
                print("[HISTORY] No existing history file, starting fresh")
        except Exception as e:
            print(f"[ERROR] Failed to load history: {e}")
            self.history = []
    
    def save_history(self):
        """Save history to file"""
        try:
            data = {
                "version": "1.0",
                "last_updated": datetime.now().isoformat(),
                "records": self.history
            }
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
            print(f"[HISTORY] Saved {len(self.history)} records")
        except Exception as e:
            print(f"[ERROR] Failed to save history: {e}")
    
    def add_record(self, 
                   session_id: str,
                   service_type: str,
                   query: str,
                   response: str,
                   provider_used: str,
                   model_used: Optional[str] = None) -> str:
        """Add a new history record"""
        record_id = str(uuid.uuid4())
        record = {
            "id": record_id,
            "session_id": session_id,
            "timestamp": datetime.now().isoformat(),
            "service_type": service_type,
            "query": query,
            "response": response,
            "provider_used": provider_used,
            "model_used": model_used
        }
        
        self.history.append(record)

        # Keep only last 1000 records to prevent file from growing too large
        if len(self.history) > 1000:
            self.history = self.history[-1000:]

        # Clear sessions cache when new record is added
        self._sessions_cache = None
        self._cache_timestamp = 0

        self.save_history()
        print(f"[HISTORY] Added record {record_id} for session {session_id}")
        return record_id
    
    def get_recent_records(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent history records"""
        return sorted(self.history, key=lambda x: x['timestamp'], reverse=True)[:limit]
    
    def get_session_records(self, session_id: str) -> List[Dict[str, Any]]:
        """Get all records for a specific session"""
        return [record for record in self.history if record['session_id'] == session_id]
    
    def search_records(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Search records by query text"""
        query_lower = query.lower()
        matching_records = []
        
        for record in self.history:
            if (query_lower in record['query'].lower() or 
                query_lower in record['response'].lower()):
                matching_records.append(record)
        
        return sorted(matching_records, key=lambda x: x['timestamp'], reverse=True)[:limit]

    def get_sessions_summary(self) -> List[Dict[str, Any]]:
        """Get all sessions with summary information - cached version"""
        import time

        current_time = time.time()

        # Check if cache is valid (cache for 30 seconds)
        if (self._sessions_cache is not None and
            current_time - self._cache_timestamp < 30):
            return self._sessions_cache

        # Rebuild cache
        sessions_dict = {}

        # Single pass through history to build session summaries
        for record in self.history:
            session_id = record['session_id']
            timestamp = record['timestamp']

            if session_id not in sessions_dict:
                # Initialize session with first record
                sessions_dict[session_id] = {
                    'session_id': session_id,
                    'last_query': record['query'],
                    'last_timestamp': timestamp,
                    'total_messages': 1,
                    'service_type': record['service_type'],
                    'last_provider': record['provider_used']
                }
            else:
                # Update session info
                session = sessions_dict[session_id]
                session['total_messages'] += 1

                # Check if this record is more recent
                if timestamp > session['last_timestamp']:
                    session['last_query'] = record['query']
                    session['last_timestamp'] = timestamp
                    session['service_type'] = record['service_type']
                    session['last_provider'] = record['provider_used']

        # Convert to list and sort by last timestamp (most recent first)
        sessions_list = list(sessions_dict.values())
        sorted_sessions = sorted(sessions_list, key=lambda x: x['last_timestamp'], reverse=True)

        # Update cache
        self._sessions_cache = sorted_sessions
        self._cache_timestamp = current_time

        return sorted_sessions

    def delete_record(self, record_id: str) -> bool:
        """Delete a specific record"""
        original_length = len(self.history)
        self.history = [record for record in self.history if record['id'] != record_id]

        if len(self.history) < original_length:
            self.save_history()
            print(f"[HISTORY] Deleted record {record_id}")
            return True
        return False

    def delete_session(self, session_id: str) -> bool:
        """Delete all records for a specific session"""
        original_length = len(self.history)
        self.history = [record for record in self.history if record['session_id'] != session_id]

        if len(self.history) < original_length:
            # Clear sessions cache when records are deleted
            self._sessions_cache = None
            self._cache_timestamp = 0

            self.save_history()
            deleted_count = original_length - len(self.history)
            print(f"[HISTORY] Deleted {deleted_count} records for session {session_id}")
            return True
        return False

    def delete_session(self, session_id: str) -> bool:
        """Delete all records for a specific session"""
        original_length = len(self.history)
        self.history = [record for record in self.history if record['session_id'] != session_id]

        if len(self.history) < original_length:
            # Clear sessions cache when records are deleted
            self._sessions_cache = None
            self._cache_timestamp = 0

            self.save_history()
            deleted_count = original_length - len(self.history)
            print(f"[HISTORY] Deleted {deleted_count} records for session {session_id}")
            return True
        return False
    
    def clear_session(self, session_id: str) -> int:
        """Clear all records for a session"""
        original_length = len(self.history)
        self.history = [record for record in self.history if record['session_id'] != session_id]
        deleted_count = original_length - len(self.history)
        
        if deleted_count > 0:
            self.save_history()
            print(f"[HISTORY] Cleared {deleted_count} records for session {session_id}")
        
        return deleted_count

# Global history manager instance
history_manager = HistoryManager()
