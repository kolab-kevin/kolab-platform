import { ModulePlaceholder } from '@/components/common/module-placeholder';
import { MODULE_PLACEHOLDERS } from '@/lib/module-placeholders';

export default function ProfilePage() {
  const module = MODULE_PLACEHOLDERS.profile;
  return <ModulePlaceholder title={module.title} description={module.description} />;
}
