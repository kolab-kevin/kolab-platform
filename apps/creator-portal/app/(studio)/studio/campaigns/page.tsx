import { ModulePlaceholder } from '@/components/common/module-placeholder';
import { MODULE_PLACEHOLDERS } from '@/lib/module-placeholders';

export default function CampaignsPage() {
  const module = MODULE_PLACEHOLDERS.campaigns;
  return <ModulePlaceholder title={module.title} description={module.description} />;
}
