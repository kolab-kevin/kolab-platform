import { ModulePlaceholder } from '@/components/common/module-placeholder';
import { MODULE_PLACEHOLDERS } from '@/lib/module-placeholders';

export default function DeliverablesPage() {
  const module = MODULE_PLACEHOLDERS.deliverables;
  return <ModulePlaceholder title={module.title} description={module.description} />;
}
