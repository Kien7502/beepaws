import { redirect } from "next/navigation";

// Launch (2026-10-21, owner): the homepage sends visitors to the flagship's
// product page. The interim homepage that sat here was the original
// grooming-store template — fake "As featured in" press logos, made-up ratings
// and testimonials, grooming categories, a 15%-off signup wired to nothing — so
// it was deleted rather than patched. Next: render <HomePageView> here (the
// dental homepage authored in the admin's Homepage editor) once its
// dental-spotlight image is in and its "real photos — never stock fur" pillar
// line is reworded. A temporary (307) redirect, so search engines keep "/".
export default function Home() {
  redirect("/products/beepaws-ultrasonic-plaque-remover");
}
