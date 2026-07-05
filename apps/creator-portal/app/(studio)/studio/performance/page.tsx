import { ModulePlaceholder } from '@/components/common/module-placeholder';
import { MODULE_PLACEHOLDERS } from '@/lib/module-placeholders';

export default function PerformancePage() {
  const module = MODULE_PLACEHOLDERS.performance;
  return <ModulePlaceholder title={module.title} description={module.description} />;
}
