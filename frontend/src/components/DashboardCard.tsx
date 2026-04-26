import { LucideIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type DashboardCardProps = {
  title: string;
  icon?: LucideIcon;
  iconImage?: string;
  href: string;
  description?: string;
  disabled?: boolean;
};

export function DashboardCard({ title, icon: Icon, iconImage, href, description, disabled = false }: DashboardCardProps) {
  const cardContent = (
    <div
      className={`
        relative h-48 overflow-hidden rounded-2xl border bg-card p-4 sm:h-52 sm:p-5 xl:h-48
        flex flex-col
        hover:shadow-md
        transition-all duration-200
        hover:border-primary/30 hover:-translate-y-0.5
        ${disabled ? "opacity-70 hover:shadow-none hover:-translate-y-0" : ""}
      `}
    >
      {disabled && (
        <span className="absolute right-4 top-4 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          Coming soon
        </span>
      )}
      <div className={iconImage ? "pb-14 pr-8" : "pb-14 pr-12"}>
        <h3 className="text-sm font-semibold text-card-foreground md:text-base">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>}
      </div>

      {iconImage ? (
        <div className="pointer-events-none absolute bottom-0 right-1 h-28 w-24 sm:h-32 sm:w-28">
          <Image src={iconImage} alt={`${title} icon`} fill className="object-contain object-bottom scale-125 origin-bottom-right" sizes="112px" />
        </div>
      ) : (
        <div className="absolute right-4 bottom-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">{Icon && <Icon className="w-5 h-5 text-primary" />}</div>
        </div>
      )}
    </div>
  );

  if (disabled) {
    return (
      <div className="group block cursor-not-allowed" aria-disabled>
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={href} className="group block">
      {cardContent}
    </Link>
  );
}
