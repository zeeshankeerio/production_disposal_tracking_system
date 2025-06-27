import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { DataProvider } from "@/components/providers/data-provider"
import { Toaster } from "@/components/ui/toaster"
import { EnhancedErrorBoundary } from "@/components/enhanced-error-boundary"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Production Tracker",
  description: "Track production and disposal of baked goods",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <EnhancedErrorBoundary>
            <DataProvider>
              <main className="w-full min-h-screen">{children}</main>
              <Toaster />
            </DataProvider>
          </EnhancedErrorBoundary>
        </ThemeProvider>
        
        {/* Script to seed database on first load */}
        <Script id="seed-database" strategy="afterInteractive">
          {`
            // Function to verify the database is ready
            async function verifyDatabase() {
              try {
                console.log('Verifying database...');
                const response = await fetch('/api/verify-db');
                const result = await response.json();
                console.log('Database verification result:', result);
                
                if (result.data && result.data.fixes && result.data.fixes.length > 0) {
                  console.log('Database issues were fixed:', result.data.fixes);
                }
                
                if ((result.data && result.data.productsCount === 0) || 
                    !localStorage.getItem('databaseSeeded')) {
                  await seedDatabase();
                }
              } catch (error) {
                console.error('Error verifying database:', error);
              }
            }
            
            // Function to seed the database
            async function seedDatabase() {
              try {
                console.log('Seeding database...');
                const response = await fetch('/api/seed', {
                  method: 'POST',
                });
                const data = await response.json();
                console.log('Database seeding response:', data);
                localStorage.setItem('databaseSeeded', 'true');
              } catch (error) {
                console.error('Error seeding database:', error);
              }
            }
            
            // Run verification on page load after a slight delay
            setTimeout(verifyDatabase, 1000);
          `}
        </Script>
      </body>
    </html>
  )
}