import LandingClient from "@/widgets/landing/LandingClient";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TaskFlow - Kanban доска для управления задачами",
  description: "Простая, красивая, удобная доска для управления вашими проектами и задачами",
}

const HomePage = () => {
  return <LandingClient/>;
};

export default HomePage;
