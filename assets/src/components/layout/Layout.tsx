import { Outlet } from "react-router";
import AppBreadcrumb from "src/components/layout/Breadcrumb";
import AppSidebar from "src/components/layout/Sidebar";
import { Separator } from "src/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "src/components/ui/sidebar";

function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
					<AppBreadcrumb/>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default Layout;
