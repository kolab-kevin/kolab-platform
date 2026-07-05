import type {
  ProductionAudioChannel,
  ProductionHeaderData,
  ProductionOutputState,
  ProductionOverlayItem,
  ProductionScene,
  ProductionSourceItem,
  ProductionStreamHealthMetrics,
  ProductionWorkspaceContext,
  ProductionWorkspaceData,
} from '@/types/production-adapters';

export function createMockProductionWorkspace(
  context: ProductionWorkspaceContext,
): ProductionWorkspaceData {
  const scenes: ProductionScene[] = [
    {
      id: 'scene_intro',
      name: 'Intro',
      isActive: false,
      sourceCount: 3,
    },
    {
      id: 'scene_main',
      name: 'Main Live',
      isActive: true,
      sourceCount: 6,
    },
    {
      id: 'scene_pk',
      name: 'PK Battle',
      isActive: false,
      sourceCount: 5,
    },
    {
      id: 'scene_outro',
      name: 'Outro',
      isActive: false,
      sourceCount: 2,
    },
  ];

  const activeScene = scenes.find((scene) => scene.isActive) ?? scenes[0]!;

  const sources: ProductionSourceItem[] = [
    { id: 'src_camera', type: 'CAMERA', label: 'Camera', visible: true },
    { id: 'src_mic', type: 'MICROPHONE', label: 'Microphone', visible: true },
    { id: 'src_browser', type: 'BROWSER_SOURCE', label: 'Browser Source', visible: true },
    { id: 'src_image', type: 'IMAGE', label: 'Brand Lower Third', visible: false },
    { id: 'src_video', type: 'VIDEO', label: 'Intro Clip', visible: false },
    { id: 'src_overlay', type: 'OVERLAY', label: 'Alert Overlay', visible: true },
    { id: 'src_media', type: 'MEDIA', label: 'Background Music', visible: true },
  ];

  const audioChannels: ProductionAudioChannel[] = [
    { id: 'audio_desktop', label: 'Desktop', volume: 72, muted: false, level: 0.58 },
    { id: 'audio_mic', label: 'Mic', volume: 84, muted: false, level: 0.74 },
    { id: 'audio_music', label: 'Music', volume: 45, muted: false, level: 0.32 },
    { id: 'audio_alerts', label: 'Alerts', volume: 60, muted: true, level: 0.12 },
  ];

  const overlays: ProductionOverlayItem[] = [
    {
      id: 'overlay_goal',
      type: 'GOAL',
      label: 'Goal overlay',
      enabled: true,
      status: 'READY',
      configurationPlaceholder: 'Goal target and progress styling',
    },
    {
      id: 'overlay_gift',
      type: 'GIFT',
      label: 'Gift overlay',
      enabled: true,
      status: 'READY',
      configurationPlaceholder: 'Gift animation and threshold rules',
    },
    {
      id: 'overlay_alert',
      type: 'ALERT',
      label: 'Alert overlay',
      enabled: true,
      status: 'READY',
      configurationPlaceholder: 'Follower and subscriber alert templates',
    },
    {
      id: 'overlay_campaign',
      type: 'CAMPAIGN',
      label: 'Campaign overlay',
      enabled: false,
      status: 'INACTIVE',
      configurationPlaceholder: 'Active campaign CTA and disclosure copy',
    },
    {
      id: 'overlay_sponsor',
      type: 'SPONSOR',
      label: 'Sponsor overlay',
      enabled: false,
      status: 'INACTIVE',
      configurationPlaceholder: 'Sponsor logo placement and duration',
    },
  ];

  const streamHealth: ProductionStreamHealthMetrics = {
    cpuUsagePercent: 38,
    fps: 59.8,
    droppedFrames: 2,
    bitrateKbps: 6200,
    latencyMs: 142,
    networkStatus: 'STABLE',
    connectionQuality: 'GOOD',
  };

  const output: ProductionOutputState = {
    previewLabel: 'Program preview placeholder',
    outputLabel: 'Stream output placeholder',
    recordingStatus: 'IDLE',
    streamingStatus: 'IDLE',
    isStreaming: false,
    isRecording: false,
  };

  const header: ProductionHeaderData = {
    creatorDisplayName: context.creatorDisplayName,
    organizationName: context.organizationName,
    streamTitlePlaceholder: 'Friday Night Live — Q&A + Music',
    platformOptions: ['TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'TWITCH'],
    selectedPlatform: 'TIKTOK',
    sceneProfilePlaceholder: 'Standard Live Profile',
    connectionStatus: 'DISCONNECTED',
  };

  return {
    header,
    scenes,
    activeSceneId: activeScene.id,
    sources,
    audioChannels,
    overlays,
    streamHealth,
    output,
  };
}
