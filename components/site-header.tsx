import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
export function SiteHeader({
  title,
  preview = false,
}: {
  title: string;
  preview?: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur-sm">
      <div className="flex w-full min-w-0 items-center gap-2 px-4 lg:px-8">
        <SidebarTrigger className="size-11 shrink-0" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        <p className="truncate text-base font-medium text-brand-navy">
          {title}
        </p>
        {preview && (
          <Badge variant="outline" className="ml-auto shrink-0">
            UI preview
          </Badge>
        )}
      </div>
    </header>
  );
}
