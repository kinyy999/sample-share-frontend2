// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/samples"); // הבית תמיד נפתח על דף הסמפלים
}
