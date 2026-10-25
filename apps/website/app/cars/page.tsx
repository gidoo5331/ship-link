import { redirect } from "next/navigation"

// Cars are products in the "cars" category; keep old links working
export default function CarsPage() {
  redirect("/products?category=cars")
}
