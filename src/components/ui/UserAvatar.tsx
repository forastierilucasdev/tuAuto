import { getInitials, cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-24 w-24 text-2xl",
} as const;

type UserAvatarProps = {
  avatarUrl?: string | null;
  fullName: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
};

/** Foto de perfil circular, o las iniciales del nombre si no hay foto cargada. */
export function UserAvatar({ avatarUrl, fullName, size = "sm", className }: UserAvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 font-semibold text-primary",
        SIZE_CLASSES[size],
        className
      )}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={fullName} className="h-full w-full object-cover object-center" />
      ) : (
        getInitials(fullName) || "?"
      )}
    </span>
  );
}
