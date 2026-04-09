import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/useI18n";
import { normalizeContentVisibility, getAccessBadgeClassName } from "@/lib/content-access";
import { cn } from "@/lib/utils";
import type { ContentVisibility } from "@/types/content";

type AccessStateBadgeProps = {
  visibility?: ContentVisibility | null;
  className?: string;
};

const AccessStateBadge = ({ visibility, className }: AccessStateBadgeProps) => {
  const { t } = useI18n();
  const normalizedVisibility = normalizeContentVisibility(visibility);

  return (
    <Badge
      variant="outline"
      className={cn("font-semibold", getAccessBadgeClassName(normalizedVisibility), className)}
    >
      {t(`creator.visibility.${normalizedVisibility}`)}
    </Badge>
  );
};

export default AccessStateBadge;
