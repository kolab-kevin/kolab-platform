import { ModulePlaceholder } from '@/components/common/module-placeholder';
import { MODULE_PLACEHOLDERS } from '@/lib/module-placeholders';

export default function GoalsPage() {
  const module = MODULE_PLACEHOLDERS.goals;
  return <ModulePlaceholder title={module.title} description={module.description} />;
}
