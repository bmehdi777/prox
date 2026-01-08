import { useMemo } from "react";
import { useLocation } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "src/components/ui/breadcrumb";
import { menu } from "src/constants/menu";

function AppBreadcrumb() {
  const location = useLocation();

  const title = useMemo(() => {
    for (const chapter of menu) {
      const t = chapter.items.find((item) => item.url === location.pathname);
      if (t !== undefined) {
        return t.title;
      }
    }
  }, [location]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage className="line-clamp-1">{title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default AppBreadcrumb;
