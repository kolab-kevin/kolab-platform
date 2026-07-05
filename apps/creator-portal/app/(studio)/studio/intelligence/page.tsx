import { ModulePlaceholder } from '@/components/common/module-placeholder';
import { MODULE_PLACEHOLDERS } from '@/lib/module-placeholders';

export default function IntelligencePage() {
  const module = MODULE_PLACEHOLDERS.intelligence;
  return <ModulePlaceholder title={module.title} description={module.description} />;
}
