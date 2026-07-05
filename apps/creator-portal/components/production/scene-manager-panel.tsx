import { Button, Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { getActiveScene, type ProductionScene } from '@/types/production-adapters';

type SceneManagerPanelProps = {
  scenes: ProductionScene[];
  activeSceneId: string;
};

export function SceneManagerPanel({ scenes, activeSceneId }: SceneManagerPanelProps) {
  const activeScene = getActiveScene(scenes, activeSceneId);

  return (
    <Card className="border-white/10 bg-white/[0.03] xl:h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Scene Manager</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {scenes.map((scene) => (
            <li
              key={scene.id}
              className={
                scene.id === activeSceneId
                  ? 'border-primary/40 bg-primary/10 rounded-lg border px-3 py-2 text-sm'
                  : 'rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm'
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{scene.name}</span>
                {scene.id === activeSceneId ? (
                  <span className="text-primary text-xs">Active</span>
                ) : null}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">{scene.sourceCount} sources</p>
            </li>
          ))}
        </ul>

        <div className="text-muted-foreground rounded-lg border border-dashed border-white/15 bg-black/20 px-3 py-8 text-center text-sm">
          Scene preview placeholder
          {activeScene ? ` — ${activeScene.name}` : ''}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled>
            Add Scene
          </Button>
          <Button size="sm" variant="outline" disabled>
            Duplicate
          </Button>
          <Button size="sm" variant="outline" disabled>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
