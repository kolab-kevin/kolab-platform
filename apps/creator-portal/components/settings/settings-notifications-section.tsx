import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

export function SettingsNotificationsSection() {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Notification preferences will be available in a future update. Campaign, live, and
          compliance alerts will appear here.
        </p>
      </CardContent>
    </Card>
  );
}
