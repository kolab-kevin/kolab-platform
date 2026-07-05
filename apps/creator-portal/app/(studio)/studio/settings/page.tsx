import { ModulePlaceholder } from '@/components/common/module-placeholder';
import { MODULE_PLACEHOLDERS } from '@/lib/module-placeholders';

export default function SettingsPage() {
  const module = MODULE_PLACEHOLDERS.settings;
  return <ModulePlaceholder title={module.title} description={module.description} />;
}
