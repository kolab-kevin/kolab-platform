import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import {
  formatLanguageList,
  formatProfileLabel,
  formatWeekday,
  type SkillsDisplayModel,
} from '@/types/profile-adapters';

type SkillsCategoriesPanelProps = {
  skills: SkillsDisplayModel | null;
};

function TagList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-xs">None listed</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-1 text-xs"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SkillsCategoriesPanel({ skills }: SkillsCategoriesPanelProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Skills &amp; Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!skills ? (
          <p className="text-muted-foreground text-sm">No skills or availability data available.</p>
        ) : (
          <>
            <TagList title="Skills" items={skills.skills} />
            <TagList title="Content categories" items={skills.categories} />
            <TagList title="Languages" items={skills.languages} />
            <TagList title="Preferred campaign types" items={skills.preferredCampaignTypes} />
            {skills.experienceLevel ? (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Experience level</h3>
                <p className="text-sm">{formatProfileLabel(skills.experienceLevel)}</p>
              </div>
            ) : null}
            <div>
              <h3 className="mb-2 text-sm font-semibold">Availability</h3>
              {!skills.availability || skills.availability.weeklySchedule.length === 0 ? (
                <p className="text-muted-foreground text-sm">No structured availability listed.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {skills.availability.weeklySchedule.map((entry) => (
                    <li key={`${entry.weekday}-${entry.start}`}>
                      {formatWeekday(entry.weekday)} · {entry.start} – {entry.end}
                    </li>
                  ))}
                </ul>
              )}
              {skills.availability?.preferredLiveTimes.length ? (
                <p className="text-muted-foreground mt-2 text-xs">
                  Preferred live times: {skills.availability.preferredLiveTimes.join(', ')}
                </p>
              ) : null}
              {skills.availability?.timezone ? (
                <p className="text-muted-foreground mt-1 text-xs">
                  Time zone: {skills.availability.timezone}
                </p>
              ) : null}
            </div>
            {skills.notes ? (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Notes</h3>
                <p className="text-sm">{skills.notes}</p>
              </div>
            ) : null}
            {skills.languages.length > 0 ? (
              <p className="text-muted-foreground text-xs">
                Profile languages: {formatLanguageList(skills.languages)}
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
