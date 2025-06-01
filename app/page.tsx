import { redirect } from "next/navigation"
import { CopyrightFooter } from "@/components/copyright-footer"

export default function Home() {
  redirect("/production")
}

