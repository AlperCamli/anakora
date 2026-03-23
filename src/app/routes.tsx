import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { ExperiencesPage } from "./pages/ExperiencesPage";
import { ProgramDetailPage } from "./pages/ProgramDetailPage";
import { ArchivePage } from "./pages/ArchivePage";
import { JournalPage } from "./pages/JournalPage";
import { JournalDetailPage } from "./pages/JournalDetailPage";
import { AboutPage } from "./pages/AboutPage";
import { AdminAuthRoot } from "./admin/components/AdminAuthRoot";
import { AdminProtectedLayout } from "./admin/components/AdminProtectedLayout";
import { AdminLoginPage } from "./admin/pages/AdminLoginPage";
import { AdminDashboardPage } from "./admin/pages/AdminDashboardPage";
import { AdminProgramsPage } from "./admin/pages/AdminProgramsPage";
import { AdminProgramEditorPage } from "./admin/pages/AdminProgramEditorPage";
import { AdminGuidesPage } from "./admin/pages/AdminGuidesPage";
import { AdminGuideEditorPage } from "./admin/pages/AdminGuideEditorPage";
import { AdminLeadsPage } from "./admin/pages/AdminLeadsPage";
import { AdminLeadDetailPage } from "./admin/pages/AdminLeadDetailPage";
import { AdminTestimonialsPage } from "./admin/pages/AdminTestimonialsPage";
import { AdminJournalAdminPage } from "./admin/pages/AdminJournalAdminPage";
import { AdminHomepagePage } from "./admin/pages/AdminHomepagePage";
import { AdminSiteSettingsPage } from "./admin/pages/AdminSiteSettingsPage";
import { AdminMediaPage } from "./admin/pages/AdminMediaPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "deneyimler", Component: ExperiencesPage },
      { path: "deneyimler/:slug", Component: ProgramDetailPage },
      { path: "arsiv", Component: ArchivePage },
      { path: "jurnal", Component: JournalPage },
      { path: "jurnal/:slug", Component: JournalDetailPage },
      { path: "hakkinda", Component: AboutPage },
    ],
  },
  {
    path: "/admin",
    Component: AdminAuthRoot,
    children: [
      { path: "login", Component: AdminLoginPage },
      {
        Component: AdminProtectedLayout,
        children: [
          { index: true, Component: AdminDashboardPage },
          { path: "programs", Component: AdminProgramsPage },
          { path: "programs/new", Component: AdminProgramEditorPage },
          { path: "programs/:programId", Component: AdminProgramEditorPage },
          { path: "guides", Component: AdminGuidesPage },
          { path: "guides/new", Component: AdminGuideEditorPage },
          { path: "guides/:guideId", Component: AdminGuideEditorPage },
          { path: "leads", Component: AdminLeadsPage },
          { path: "leads/:leadId", Component: AdminLeadDetailPage },
          { path: "testimonials", Component: AdminTestimonialsPage },
          { path: "journal", Component: AdminJournalAdminPage },
          { path: "homepage", Component: AdminHomepagePage },
          { path: "site-settings", Component: AdminSiteSettingsPage },
          { path: "media", Component: AdminMediaPage },
        ],
      },
    ],
  },
]);
