'use client';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { useTheme } from '@/contexts/theme-context';

export function SettingsAppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Appearance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm">
          Choose how Creator Studio looks on this device.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme('dark')}
          >
            Dark
          </Button>
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme('light')}
          >
            Light
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
