export function CopyrightFooter() {
  return (
    <div className="text-left text-xs text-muted-foreground/70 pt-4 pb-8">
      <p className="font-light">
        A Product By{" "}
        <a 
          href="https://www.mindscapeanalytics.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary/80 hover:text-primary transition-colors duration-200 underline underline-offset-2"
        >
          Mindscape Analytics
        </a>
        {" "}© 2025
      </p>
    </div>
  )
} 