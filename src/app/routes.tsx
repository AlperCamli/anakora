import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { ExperiencesPage } from "./pages/ExperiencesPage";
import { ProgramDetailPage } from "./pages/ProgramDetailPage";
import { ArchivePage } from "./pages/ArchivePage";
import { JournalPage } from "./pages/JournalPage";
import { JournalDetailPage } from "./pages/JournalDetailPage";
import { AboutPage } from "./pages/AboutPage";
import { LegalPage } from "./pages/LegalPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "deneyimler", Component: ExperiencesPage },
      { path: "deneyimler/:id", Component: ProgramDetailPage },
      { path: "arsiv", Component: ArchivePage },
      { path: "jurnal", Component: JournalPage },
      { path: "jurnal/:slug", Component: JournalDetailPage },
      { path: "hakkinda", Component: AboutPage },
      { path: "gizlilik", Component: LegalPage },
      { path: "sartlar", Component: LegalPage },
    ],
  },
]);
