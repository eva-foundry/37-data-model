export interface PageItem {
  id: string;
  label: string;
}

const DEFAULT_BASE_URL =
  import.meta.env.VITE_DATA_MODEL_URL ||
  'https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io';

function normalizeLayer(value: unknown): PageItem | null {
  if (typeof value === 'string') {
    return {
      id: value,
      label: value,
    };
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const layerObj = value as Record<string, unknown>;
  const id = layerObj.id ?? layerObj.layer ?? layerObj.name;
  const label = layerObj.label ?? layerObj.title ?? layerObj.name ?? id;

  if (typeof id !== 'string') {
    return null;
  }

  return {
    id,
    label: typeof label === 'string' ? label : id,
  };
}

function buildFallbackPages(): PageItem[] {
  return Array.from({ length: 111 }, (_, index) => {
    const layerNumber = String(index + 1).padStart(2, '0');
    return {
      id: `L${layerNumber}`,
      label: `Layer ${layerNumber}`,
    };
  });
}

export async function loadPageCatalog(): Promise<PageItem[]> {
  try {
    const response = await fetch(`${DEFAULT_BASE_URL}/model/agent-guide`);
    if (!response.ok) {
      return buildFallbackPages();
    }

    const data = (await response.json()) as Record<string, unknown>;
    const layers = Array.isArray(data.layers_available) ? data.layers_available : [];

    const normalized = layers
      .map((layer) => normalizeLayer(layer))
      .filter((layer): layer is PageItem => layer !== null);

    return normalized.length > 0 ? normalized : buildFallbackPages();
  } catch {
    return buildFallbackPages();
  }
}
