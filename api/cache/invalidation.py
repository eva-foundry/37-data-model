"""
Cache Invalidation Module for EVA Data Model API

Event-driven cache invalidation with write-through patterns and
dependency tracking for multi-layer cache consistency.
"""

import asyncio
import logging
from typing import Callable, Dict, List, Set, Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class InvalidationEvent:
    """Represents a cache invalidation event"""
    
    def __init__(self, 
                 change_type: str,  # 'create', 'update', 'delete'
                 entity_type: str,  # Layer name (e.g., 'projects', 'evidence')
                 entity_id: str,
                 affected_keys: List[str],
                 affected_patterns: List[str],
                 related_entities: Dict[str, List[str]] = None):
        """Initialize invalidation event
        
        Args:
            change_type: Type of change (create, update, delete)
            entity_type: Type of entity being changed
            entity_id: ID of entity being changed
            affected_keys: Specific cache keys to invalidate
            affected_patterns: Cache key patterns to invalidate
            related_entities: Related entities that may be affected
        """
        self.change_type = change_type
        self.entity_type = entity_type
        self.entity_id = entity_id
        self.affected_keys = affected_keys or []
        self.affected_patterns = affected_patterns or []
        self.related_entities = related_entities or {}
        self.timestamp = datetime.now().isoformat()
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            'change_type': self.change_type,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'affected_keys': self.affected_keys,
            'affected_patterns': self.affected_patterns,
            'related_entities': self.related_entities,
            'timestamp': self.timestamp
        }


class CacheInvalidationManager:
    """Manages cache invalidation events and dependencies"""
    
    # Dependency map: When entity X changes, what other cache patterns are affected?
    DEPENDENCY_MAP = {
        'projects': {
            'patterns': ['project:*', 'projects:*'],
            'affects': ['evidence', 'milestones', 'sprints'],  # Cascading dependencies
        },
        'evidence': {
            'patterns': ['evidence:*', 'evidence:*'],
            'affects': ['projects', 'quality_gates'],  # Evidence changes affect all
        },
        'sprints': {
            'patterns': ['sprint:*', 'sprints:*'],
            'affects': ['evidence', 'projects'],
        },
        'milestones': {
            'patterns': ['milestone:*', 'milestones:*'],
            'affects': ['projects', 'evidence'],
        },
        'quality_gates': {
            'patterns': ['quality_gate:*', 'gates:*'],
            'affects': [],
        }
    }
    
    def __init__(self, cache_layer=None):
        """Initialize invalidation manager
        
        Args:
            cache_layer: Reference to cache layer for invalidation operations
        """
        self.cache_layer = cache_layer
        self.event_queue: asyncio.Queue = asyncio.Queue()
        self.event_handlers: Dict[str, List[Callable]] = {}
        self.event_history: List[InvalidationEvent] = []
        self.max_history = 1000
        self._running = False
        
        # Statistics
        self.total_events = 0
        self.total_invalidated = 0
        self.cascading_invalidations = 0
    
    def register_handler(self, entity_type: str, handler: Callable) -> None:
        """Register a handler for entity type changes
        
        Args:
            entity_type: Entity type (e.g., 'projects', 'evidence')
            handler: Async callable to execute on invalidation event
        """
        if entity_type not in self.event_handlers:
            self.event_handlers[entity_type] = []
        self.event_handlers[entity_type].append(handler)
        logger.info(f"Registered handler for entity type: {entity_type}")
    
    async def emit_event(self, event: InvalidationEvent) -> None:
        """Emit an invalidation event
        
        Args:
            event: InvalidationEvent instance
        """
        # For test environments or direct processing, execute immediately
        if not self._running:
            await self.process_event(event)
        else:
            # For production with background loop, queue the event
            await self.event_queue.put(event)
    
    async def invalidate_on_create(self, entity_type: str, entity_id: str) -> None:
        """Handle entity creation"""
        event = InvalidationEvent(
            change_type='create',
            entity_type=entity_type,
            entity_id=entity_id,
            affected_keys=[f'{entity_type}:list'],
            affected_patterns=[f'{entity_type}:*']
        )
        await self.emit_event(event)
    
    async def invalidate_on_update(self, 
                                   entity_type: str, 
                                   entity_id: str,
                                   related_entities: Dict[str, List[str]] = None) -> None:
        """Handle entity update with optional cascading invalidation
        
        Args:
            entity_type: Type of entity being updated
            entity_id: ID of entity being updated
            related_entities: Related entities that may also need invalidation
        """
        event = InvalidationEvent(
            change_type='update',
            entity_type=entity_type,
            entity_id=entity_id,
            affected_keys=[f'{entity_type}:{entity_id}', f'{entity_type}:list'],
            affected_patterns=[f'{entity_type}:{entity_id}:*'],
            related_entities=related_entities
        )
        await self.emit_event(event)
    
    async def invalidate_on_delete(self, entity_type: str, entity_id: str) -> None:
        """Handle entity deletion"""
        event = InvalidationEvent(
            change_type='delete',
            entity_type=entity_type,
            entity_id=entity_id,
            affected_keys=[f'{entity_type}:{entity_id}', f'{entity_type}:list'],
            affected_patterns=[f'{entity_type}*']
        )
        await self.emit_event(event)
    
    def _get_cascading_patterns(self, entity_type: str) -> List[str]:
        """Get cache patterns for cascading invalidation
        
        Args:
            entity_type: Type of entity that changed
            
        Returns:
            List of cache patterns to invalidate
        """
        patterns = []
        
        if entity_type in self.DEPENDENCY_MAP:
            dep = self.DEPENDENCY_MAP[entity_type]
            patterns.extend(dep.get('patterns', []))
            
            # Add dependent entity patterns
            for affected_entity in dep.get('affects', []):
                if affected_entity in self.DEPENDENCY_MAP:
                    patterns.extend(self.DEPENDENCY_MAP[affected_entity].get('patterns', []))
        
        return patterns
    
    async def process_event(self, event: InvalidationEvent) -> int:
        """Process invalidation event and invalidate cache keys
        
        Args:
            event: InvalidationEvent to process
            
        Returns:
            Number of keys invalidated
        """
        invalidated_count = 0
        
        if not self.cache_layer:
            logger.warning("Cache layer not configured, skipping invalidation")
            return 0
        
        try:
            # Invalidate specific keys
            for key in event.affected_keys:
                if await self.cache_layer.invalidate(key):
                    invalidated_count += 1
            
            # Invalidate pattern-based keys
            for pattern in event.affected_patterns:
                deleted = await self.cache_layer.invalidate_pattern(pattern)
                invalidated_count += deleted
            
            # Handle cascading invalidations
            cascading_patterns = self._get_cascading_patterns(event.entity_type)
            if event.change_type == 'delete' and cascading_patterns:
                for pattern in cascading_patterns:
                    deleted = await self.cache_layer.invalidate_pattern(pattern)
                    invalidated_count += deleted
                    self.cascading_invalidations += 1
            
            # Execute registered handlers
            handlers = self.event_handlers.get(event.entity_type, [])
            for handler in handlers:
                try:
                    await handler(event)
                except Exception as e:
                    logger.error(f"Handler error for {event.entity_type}: {e}")
            
            # Track statistics
            self.total_events += 1
            self.total_invalidated += invalidated_count
            
            # Store in history
            self.event_history.append(event)
            if len(self.event_history) > self.max_history:
                self.event_history = self.event_history[-self.max_history:]
            
            logger.info(f"Invalidated {invalidated_count} keys for {event.entity_type}:{event.entity_id}")
            
        except Exception as e:
            logger.error(f"Error processing invalidation event: {e}")
        
        return invalidated_count
    
    async def start(self) -> None:
        """Start event processing loop"""
        self._running = True
        logger.info("Starting cache invalidation manager")
        
        try:
            while self._running:
                try:
                    # Get event with timeout to allow graceful shutdown
                    event = await asyncio.wait_for(self.event_queue.get(), timeout=1.0)
                    await self.process_event(event)
                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    logger.error(f"Event processing error: {e}")
        except Exception as e:
            logger.error(f"Invalidation manager error: {e}")
        finally:
            self._running = False
            logger.info("Cache invalidation manager stopped")
    
    async def stop(self) -> None:
        """Stop event processing loop"""
        self._running = False
        logger.info("Stopping cache invalidation manager")
    
    def stats(self) -> dict:
        """Get invalidation statistics"""
        return {
            'total_events': self.total_events,
            'total_invalidated_keys': self.total_invalidated,
            'cascading_invalidations': self.cascading_invalidations,
            'queue_size': self.event_queue.qsize(),
            'history_size': len(self.event_history),
            'handlers_registered': {k: len(v) for k, v in self.event_handlers.items()}
        }
    
    def get_history(self, limit: int = 20) -> List[dict]:
        """Get recent invalidation events
        
        Args:
            limit: Maximum number of events to return
            
        Returns:
            List of events (most recent first)
        """
        return [e.to_dict() for e in reversed(self.event_history[-limit:])]


class WriteThroughCache:
    """Write-through cache pattern that ensures write consistency"""
    
    def __init__(self, cache_layer, invalidation_manager: CacheInvalidationManager):
        """Initialize write-through cache
        
        Args:
            cache_layer: Cache layer instance
            invalidation_manager: Cache invalidation manager
        """
        self.cache = cache_layer
        self.invalidation = invalidation_manager
    
    async def write_and_invalidate(self,
                                   entity_type: str,
                                   entity_id: str,
                                   data: dict,
                                   change_type: str = 'update',
                                   related_entities: Dict[str, List[str]] = None) -> bool:
        """Write data and automatically invalidate related cache entries
        
        Args:
            entity_type: Type of entity being written
            entity_id: ID of entity
            data: Data being written (not cached here, goes to Cosmos)
            change_type: Type of change (create, update, delete)
            related_entities: Related entities that may also be affected
            
        Returns:
            True if write and invalidation successful
        """
        try:
            # In real implementation, this would write to Cosmos DB first
            # For now, we just handle the invalidation
            
            if change_type == 'create':
                await self.invalidation.invalidate_on_create(entity_type, entity_id)
            elif change_type == 'update':
                await self.invalidation.invalidate_on_update(
                    entity_type, entity_id, related_entities
                )
            elif change_type == 'delete':
                await self.invalidation.invalidate_on_delete(entity_type, entity_id)
            
            return True
        except Exception as e:
            logger.error(f"Write-through error: {e}")
            return False
    
    async def cache_and_return(self, key: str, value: dict, ttl: int) -> dict:
        """Cache a value and return it
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
            
        Returns:
            The value that was cached
        """
        try:
            await self.cache.set(key, value)
            return value
        except Exception as e:
            logger.error(f"Cache write error: {e}")
            return value


# Utility function to create configured invalidation manager
def create_invalidation_manager(cache_layer=None) -> CacheInvalidationManager:
    """Factory to create configured invalidation manager"""
    return CacheInvalidationManager(cache_layer=cache_layer)
