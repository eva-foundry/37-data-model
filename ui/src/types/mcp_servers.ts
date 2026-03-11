/**
 * McpServers Types - Generated from Data Model Layer: mcp_servers
 */

export interface McpServersRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateMcpServersInput {
  id: string;
  [key: string]: any;
}

export interface UpdateMcpServersInput extends Partial<CreateMcpServersInput> {
  id: string;
}
