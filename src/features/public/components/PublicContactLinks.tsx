import { CONTACT_PLATFORM_LABELS } from "@/features/clubs/labels";
import { Icon } from "@/shared/ui/Icon";
import type { ContactPlatform, PublicContactLink } from "@/shared/types";

interface PublicContactLinksProps {
  links: PublicContactLink[];
}

export default function PublicContactLinks({ links }: PublicContactLinksProps) {
  if (links.length === 0) return null;

  return (
    <section className="card p-5">
      <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-slate-900">
        <Icon name="link" size={16} className="text-brand-600" />
        İletişim
      </h2>
      <ul className="space-y-2">
        {links.map((link) => {
          const platform = link.platform as ContactPlatform;
          const meta = CONTACT_PLATFORM_LABELS[platform] ?? CONTACT_PLATFORM_LABELS.other;
          return (
            <li key={link.id}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white/70 px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-200 hover:text-brand-700"
              >
                <Icon name={meta.icon} size={16} className="text-brand-600" />
                {meta.label}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
