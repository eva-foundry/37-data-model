"""
Cache Layer Adapter for Existing Layer Routers

Provides wrapper patterns for integrating cache into FastAPI routers
without modifying existing Cosmos DB query logic.
"""

import logging
from typing import Callable, Optional, Any, Dict, List
import inspect

logger = logging.getLogger(__name__)


class LayerRouterCacheAdapter:
    """Adapter for caching existing layer router endpoints"""
    
    def __init__(self, cache_layer, invalidation_manager=None, ttl_seconds: int = 1800):
        """Initialize adapter
        
        Args:
            cache_layer: Cache layer instance
            invalidation_manager: Optional invalidation manager for automatic invalidation
            ttl_seconds: Default TTL for cached responses (default: 30 minutes)
        """
        self.cache = cache_layer
        self.invalidation = invalidation_manager
        self.ttl = ttl_seconds
    
    def _make_cache_key(self, entity_type: str, entity_id: Optional[str] = None, 
                       operation: str = 'get', query_params: Optional[Dict] = None) -> str:
        """Generate cache key
        
        Args:
            entity_type: Type of entity (e.g., 'projects', 'evidence')
            entity_id: ID of specific entity (optional)
            operation: Operation type (get, list, search, etc.)
            query_params: Query parameters for cache key differentiation
            
        Returns:
            Cache key string
        """
        parts = [entity_type, operation]
        
        if entity_id:
            parts.append(entity_id)
        
        if query_params:
            # Create deterministic query string
            sorted_params = '&'.join(
                f"{k}={v}" for k, v in sorted(query_params.items())
            )
            parts.append(sorted_params)
        
        return ':'.join(parts)
    
    async def cached_get(self, 
                        entity_type: str,
                        entity_id: str,
                        fetch_func: Callable,
                        invalidate_on_miss: bool = False) -> Optional[Any]:
        """Get with caching
        
        Args:
            entity_type: Type of entity
            entity_id: Entity ID
            fetch_func: Async function to fetch from Cosmos if not cached
            invalidate_on_miss: Whether to invalidate on cache miss
            
        Returns:
            Cached or fetched entity
        """
        cache_key = self._make_cache_key(entity_type, entity_id)
        
        # Try cache first
        try:
            cached = await self.cache.get(cache_key)
            if cached is not None:
                logger.debug(f"Cache hit: {cache_key}")
                return cached
        except Exception as e:
            logger.warning(f"Cache get error: {e}")
        
        # Cache miss: fetch from source
        try:
            logger.debug(f"Cache miss: {cache_key}")
            result = await fetch_func(entity_id)
            
            if result is not None:
                # Populate cache
                try:
                    await self.cache.set(cache_key, result)
                except Exception as e:
                    logger.warning(f"Cache set error: {e}")
            
            return result
        
        except Exception as e:
            logger.error(f"Fetch error for {cache_key}: {e}")
            raise
    
    async def cached_list(self,
                         entity_type: str,
                         fetch_func: Callable,
                         query_params: Optional[Dict] = None) -> List[Any]:
        """Get list with caching
        
        Args:
            entity_type: Type of entity
            fetch_func: Async function to fetch list from Cosmos
            query_params: Query parameters for cache differentiation
            
        Returns:
            Cached or fetched list
        """
        cache_key = self._make_cache_key(entity_type, operation='list', 
                                        query_params=query_params)
        
        # Try cache first
        try:
            cached = await self.cache.get(cache_key)
            if cached is not None:
                logger.debug(f"Cache hit: {cache_key}")
                return cached
        except Exception as e:
            logger.warning(f"Cache get error: {e}")
        
        # Cache miss: fetch from source
        try:
            logger.debug(f"Cache miss: {cache_key}")
            result = await fetch_func(**(query_params or {}))
            
            if result:
                # Populate cache
                try:
                    await self.cache.set(cache_key, result)
                except Exception as e:
                    logger.warning(f"Cache set error: {e}")
            
            return result
        
        except Exception as e:
            logger.error(f"Fetch error for {cache_key}: {e}")
            raise
    
    async def cached_search(self,
                           entity_type: str,
                           fetch_func: Callable,
                           search_query: str,
                           limit: int = 100) -> List[Any]:
        """Search with caching
        
        Args:
            entity_type: Type of entity
            fetch_func: Async function to execute search
            search_query: Search query string
            limit: Result limit
            
        Returns:
            Cached or fetched search results
        """
        query_params = {'query': search_query, 'limit': limit}
        cache_key = self._make_cache_key(entity_type, operation='search',
                                        query_params=query_params)
        
        # Try cache first (search results are cacheable)
        try:
            cached = await self.cache.get(cache_key)
            if cached is not None:
                logger.debug(f"Search cache hit: {cache_key}")
                return cached
        except Exception as e:
            logger.warning(f"Cache get error: {e}")
        
        # Execute search
        try:
            logger.debug(f"Search cache miss: {cache_key}")
            result = await fetch_func(search_query, limit)
            
            if result:
                # Cache search results with shorter TTL
                try:
                    await self.cache.set(cache_key, result)
                except Exception as e:
                    logger.warning(f"Cache set error: {e}")
            
            return result
        
        except Exception as e:
            logger.error(f"Search error for {cache_key}: {e}")
            raise
    
    async def write_with_invalidation(self,
                                     entity_type: str,
                                     entity_id: str,
                                     write_func: Callable,
                                     change_type: str = 'update',
                                     related_entities: Optional[Dict[str, List[str]]] = None) -> Any:
        """Write with automatic cache invalidation
        
        Args:
            entity_type: Type of entity being written
            entity_id: Entity ID
            write_func: Async function to execute write
            change_type: Type of change (create, update, delete)
            related_entities: Related entities to invalidate
            
        Returns:
            Result from write operation
        """
        try:
            # Execute write operation
            result = await write_func(entity_id)
            
            # Trigger invalidation if manager configured
            if self.invalidation:
                if change_type == 'create':
                    await self.invalidation.invalidate_on_create(entity_type, entity_id)
                elif change_type == 'update':
                    await self.invalidation.invalidate_on_update(
                        entity_type, entity_id, related_entities
                    )
                elif change_type == 'delete':
                    await self.invalidation.invalidate_on_delete(entity_type, entity_id)
            
            return result
        
        except Exception as e:
            logger.error(f"Write error for {entity_type}:{entity_id}: {e}")
            raise
    
    async def invalidate_entity(self, entity_type: str, entity_id: Optional[str] = None):
        """Manually invalidate cache entries"""
        
        if not self.invalidation:
            logger.warning("Invalidation manager not configured")
            return
        
        if entity_id:
            cache_key = self._make_cache_key(entity_type, entity_id)
            await self.cache.invalidate(cache_key)
            logger.info(f"Invalidated: {cache_key}")
        else:
            # Invalidate all of this entity type
            pattern = f"{entity_type}:*"
            await self.cache.invalidate_pattern(pattern)
            logger.info(f"Invalidated pattern: {pattern}")


class CachedLayerRouter:
    """Cached wrapper for layer router"""
    
    def __init__(self, original_router, adapter: LayerRouterCacheAdapter, entity_type: str):
        """Initialize cached router
        
        Args:
            original_router: Original layer router instance
            adapter: Cache adapter instance
            entity_type: Type of entity this router handles
        """
        self.router = original_router
        self.adapter = adapter
        self.entity_type = entity_type
    
    async def get(self, entity_id: str):
        """GET endpoint with cache"""
        return await self.adapter.cached_get(
            entity_type=self.entity_type,
            entity_id=entity_id,
            fetch_func=self.router.get
        )
    
    async def get_by_id(self, entity_id: str):
        """GET by ID with cache"""
        return await self.adapter.cached_get(
            entity_type=self.entity_type,
            entity_id=entity_id,
            fetch_func=self.router.get_by_id
        )
    
    async def list(self, skip: int = 0, limit: int = 100, filters: Optional[Dict] = None):
        """LIST endpoint with cache"""
        query_params = {'skip': skip, 'limit': limit}
        if filters:
            query_params.update(filters)
        
        return await self.adapter.cached_list(
            entity_type=self.entity_type,
            fetch_func=lambda **kwargs: self.router.list(**kwargs),
            query_params=query_params
        )
    
    async def search(self, query: str, limit: int = 100):
        """SEARCH endpoint with cache"""
        return await self.adapter.cached_search(
            entity_type=self.entity_type,
            fetch_func=self.router.search,
            search_query=query,
            limit=limit
        )
    
    async def create(self, entity_id: str, data: dict):
        """CREATE endpoint with invalidation"""
        return await self.adapter.write_with_invalidation(
            entity_type=self.entity_type,
            entity_id=entity_id,
            write_func=lambda eid: self.router.create(eid, data),
            change_type='create'
        )
    
    async def update(self, entity_id: str, data: dict, related_entities: Optional[Dict] = None):
        """UPDATE endpoint with invalidation"""
        return await self.adapter.write_with_invalidation(
            entity_type=self.entity_type,
            entity_id=entity_id,
            write_func=lambda eid: self.router.update(eid, data),
            change_type='update',
            related_entities=related_entities
        )
    
    async def delete(self, entity_id: str):
        """DELETE endpoint with invalidation"""
        return await self.adapter.write_with_invalidation(
            entity_type=self.entity_type,
            entity_id=entity_id,
            write_func=self.router.delete,
            change_type='delete'
        )
    
    async def invalidate(self, entity_id: Optional[str] = None):
        """Manually invalidate cache"""
        await self.adapter.invalidate_entity(self.entity_type, entity_id)


# Helper to wrap multiple routers at once
def create_cached_routers(routers_config: Dict[str, Any], 
                         adapter: LayerRouterCacheAdapter) -> Dict[str, CachedLayerRouter]:
    """Create cached wrappers for multiple routers
    
    Args:
        routers_config: Config with entity_type -> router_instance mapping
        adapter: Cache adapter instance
        
    Returns:
        Dict of entity_type -> CachedLayerRouter
    """
    cached_routers = {}
    
    for entity_type, router in routers_config.items():
        cached_routers[entity_type] = CachedLayerRouter(
            original_router=router,
            adapter=adapter,
            entity_type=entity_type
        )
    
    return cached_routers


# Example usage helper
"""
Example implementation in main FastAPI app:

from api.cache import create_cache_layer
from api.cache.adapter import LayerRouterCacheAdapter, create_cached_routers
from api.layer.projects import ProjectsRouter
from api.layer.evidence import EvidenceRouter
from api.layer.sprints import SprintsRouter

# Initialize cache layer
cache_layer = create_cache_layer(
    redis_client=redis_client,
    cosmos_store=cosmos_db
)

# Create adapter
cache_adapter = LayerRouterCacheAdapter(
    cache_layer=cache_layer,
    invalidation_manager=invalidation_manager,
    ttl_seconds=1800
)

# Wrap existing routers
original_routers = {
    'projects': ProjectsRouter(cosmos_db),
    'evidence': EvidenceRouter(cosmos_db),
    'sprints': SprintsRouter(cosmos_db),
}

cached_routers = create_cached_routers(original_routers, cache_adapter)

# Use cached routers in app
app = FastAPI()

@app.get("/model/projects/{project_id}")
async def get_project(project_id: str):
    return await cached_routers['projects'].get(project_id)

@app.get("/model/projects")
async def list_projects(skip: int = 0, limit: int = 100):
    return await cached_routers['projects'].list(skip, limit)

@app.post("/model/projects")
async def create_project(project_id: str, data: dict):
    return await cached_routers['projects'].create(project_id, data)

# Similar for evidence, sprints, etc.
"""
