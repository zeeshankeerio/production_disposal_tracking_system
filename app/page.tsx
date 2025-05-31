import { redirect } from "next/navigation"
import { CopyrightFooter } from "@/components/copyright-footer"

export default function HomePage() {
  redirect("/entries")
  
  // This won't be shown, but including for consistency
  return (
    <div>
      <CopyrightFooter />
    </div>
  )
}

