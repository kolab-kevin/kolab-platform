export type ProductionWorkspaceContext = {
  creatorProfileId: string;
  creatorDisplayName: string;
  organizationId: string;
  organizationName: string;
};

export type ProductionConnectionStatus =
  'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR';

export type ProductionSourceType =
  'CAMERA' | 'MICROPHONE' | 'BROWSER_SOURCE' | 'IMAGE' | 'VIDEO' | 'OVERLAY' | 'MEDIA';

export type ProductionOverlayType = 'GOAL' | 'GIFT' | 'ALERT' | 'CAMPAIGN' | 'SPONSOR';

export type ProductionOverlayStatus = 'READY' | 'INACTIVE' | 'CONFIGURING';

export type ProductionRecordingStatus = 'IDLE' | 'RECORDING' | 'PAUSED';

export type ProductionStreamingStatus = 'IDLE' | 'LIVE' | 'STOPPING';

export type ProductionNetworkStatus = 'STABLE' | 'DEGRADED' | 'OFFLINE';

export type ProductionConnectionQuality = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

export type ProductionHeaderData = {
  creatorDisplayName: string;
  organizationName: string;
  streamTitlePlaceholder: string;
  platformOptions: string[];
  selectedPlatform: string;
  sceneProfilePlaceholder: string;
  connectionStatus: ProductionConnectionStatus;
};

export type ProductionScene = {
  id: string;
  name: string;
  isActive: boolean;
  sourceCount: number;
};

export type ProductionSourceItem = {
  id: string;
  type: ProductionSourceType;
  label: string;
  visible: boolean;
};

export type ProductionAudioChannel = {
  id: string;
  label: string;
  volume: number;
  muted: boolean;
  level: number;
};

export type ProductionOverlayItem = {
  id: string;
  type: ProductionOverlayType;
  label: string;
  enabled: boolean;
  status: ProductionOverlayStatus;
  configurationPlaceholder: string;
};

export type ProductionStreamHealthMetrics = {
  cpuUsagePercent: number;
  fps: number;
  droppedFrames: number;
  bitrateKbps: number;
  latencyMs: number;
  networkStatus: ProductionNetworkStatus;
  connectionQuality: ProductionConnectionQuality;
};

export type ProductionOutputState = {
  previewLabel: string;
  outputLabel: string;
  recordingStatus: ProductionRecordingStatus;
  streamingStatus: ProductionStreamingStatus;
  isStreaming: boolean;
  isRecording: boolean;
};

export type ProductionWorkspaceData = {
  header: ProductionHeaderData;
  scenes: ProductionScene[];
  activeSceneId: string;
  sources: ProductionSourceItem[];
  audioChannels: ProductionAudioChannel[];
  overlays: ProductionOverlayItem[];
  streamHealth: ProductionStreamHealthMetrics;
  output: ProductionOutputState;
};

export function formatProductionLabel(value: string): string {
  return value.replaceAll('_', ' ');
}

export function getActiveScene(
  scenes: ProductionScene[],
  activeSceneId: string,
): ProductionScene | null {
  return scenes.find((scene) => scene.id === activeSceneId) ?? null;
}

export function formatConnectionStatus(status: ProductionConnectionStatus): string {
  switch (status) {
    case 'DISCONNECTED':
      return 'Disconnected (mock)';
    case 'CONNECTING':
      return 'Connecting…';
    case 'CONNECTED':
      return 'Connected';
    case 'RECONNECTING':
      return 'Reconnecting…';
    case 'ERROR':
      return 'Connection error';
    default:
      return formatProductionLabel(status);
  }
}

export function formatAudioLevel(level: number): string {
  return `${Math.round(level * 100)}%`;
}

export function createEmptyProductionWorkspaceData(): ProductionWorkspaceData {
  return {
    header: {
      creatorDisplayName: 'Creator',
      organizationName: 'Organization',
      streamTitlePlaceholder: 'Stream title',
      platformOptions: [],
      selectedPlatform: 'TIKTOK',
      sceneProfilePlaceholder: 'Default profile',
      connectionStatus: 'DISCONNECTED',
    },
    scenes: [],
    activeSceneId: '',
    sources: [],
    audioChannels: [],
    overlays: [],
    streamHealth: {
      cpuUsagePercent: 0,
      fps: 0,
      droppedFrames: 0,
      bitrateKbps: 0,
      latencyMs: 0,
      networkStatus: 'OFFLINE',
      connectionQuality: 'POOR',
    },
    output: {
      previewLabel: 'Preview unavailable',
      outputLabel: 'Output unavailable',
      recordingStatus: 'IDLE',
      streamingStatus: 'IDLE',
      isStreaming: false,
      isRecording: false,
    },
  };
}
