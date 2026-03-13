# Unified Screen Registry Design

**Generated**: 2026-03-12T22:37:34.4076499-03:00  
**Status**: Planning Complete

## Overview

This document describes the unified registry for all 163 screens across:
- **121 Data-Model Layers** (L1-L121)
- **23 Eva-Faces UI Components** (reactive pages and components)
- **19 Project Screens** (projects 39, 45, 46)
- **10 Ops Screens** (planned, projects 40, 50)

## Schema

Screens are stored with 25 properties in Cosmos DB. Core required fields:
- **id**: Unique identifier
- **name**: Human-readable name
- **source**: Origin (data-model, eva-faces, project, ops)
- **status**: Lifecycle (operational, pending, planned, deprecated, archived)
- **type**: Classification (layer, page, component, screen, definition)
- **category**: Functional grouping
- **created_at**, **updated_at**: Timestamps

## Querying Strategy

### Primary Index: /source
Partition key enables efficient queries by screen source:
- data-model: 121 screens
- va-faces: 23 screens
- project: 19 screens
- ops: 10 screens

### Composite Indexes
- **source + status**: Find operational/pending screens by source
- **source + category**: Find screens by functional area
- **layer_id + status**: Cross-reference by layer
- **project + status**: Query by project assignment

### Common Query Patterns

`sql
-- Get all operational data-model screens  
SELECT * FROM screens WHERE screens.source = 'data-model' AND screens.status = 'operational'

-- Get all eva-faces components
SELECT * FROM screens WHERE screens.source = 'eva-faces'

-- Get screens by category (monitoring, dashboard, etc)
SELECT * FROM screens WHERE screens.category = 'monitoring'

-- Get screens with specific tag
SELECT * FROM screens WHERE ARRAY_CONTAINS(screens.tags, 'alerts')
`

## Storage Structure

| Source | Count | Status | Category | Type |
|--------|-------|--------|----------|------|
| data-model | 121 | operational/pending | data-model | layer |
| eva-faces | 23 | operational | ui | page/component |
| project | 19 | operational/pending | project | screen |
| ops | 10 | planned | ops | screen |
| **Total** | **163** | **Mixed** | **Mixed** | **Mixed** |

## Throughput Sizing

- **Minimum**: 400 RU/s (development/testing)
- **Recommended**: 1000 RU/s (production baseline)
- **High Load**: 5000 RU/s (peak concurrent queries across all sources)

## Next Steps (PART 2.DO)

1. Register all 135 discovered screens  
2. Add seed data for remaining 28 screens (if found during DO phase)
3. Verify all 163 screens queryable  
4. Test common query patterns

