import { ModulePlaceholder } from '@/components/common/module-placeholder';
import { MODULE_PLACEHOLDERS } from '@/lib/module-placeholders';

export default function CoachPage() {
  const module = MODULE_PLACEHOLDERS.coach;
  return <ModulePlaceholder title={module.title} description={module.description} />;
}
