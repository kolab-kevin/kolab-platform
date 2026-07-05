import { ModulePlaceholder } from '@/components/common/module-placeholder';
import { MODULE_PLACEHOLDERS } from '@/lib/module-placeholders';

export default function LivePage() {
  const module = MODULE_PLACEHOLDERS.live;
  return <ModulePlaceholder title={module.title} description={module.description} />;
}
