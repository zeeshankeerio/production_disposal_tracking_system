"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ProductionEntry, DisposalEntry } from "@/lib/types"
import { formatNumber } from "@/lib/utils"
import { BarChart3, Calendar, CheckCircle, Clock, FileText, InfoIcon, Trash2, User, ChevronDown, ChevronUp, ClipboardCopy, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useData } from "@/components/providers/data-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface EntryDetailViewProps {
  entry: ProductionEntry | DisposalEntry
  type: "production" | "disposal"
}

export function EntryDetailView({ entry, type }: EntryDetailViewProps) {
  const [expanded, setExpanded] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const { deleteProductionEntry, deleteDisposalEntry } = useData()
  
  // Type guard to check if an entry is a DisposalEntry
  const isDisposalEntry = (entry: ProductionEntry | DisposalEntry): entry is DisposalEntry => {
    return 'reason' in entry
  }
  
  const toggleExpand = () => {
    setExpanded(!expanded)
  }
  
  const copyToClipboard = () => {
    let text = `Product: ${entry.product_name}\n`
    text += `Quantity: ${entry.quantity}\n`
    text += `Date: ${format(new Date(entry.date), "PPP")}\n`
    text += `Shift: ${entry.shift === "morning" ? "Morning" : entry.shift === "afternoon" ? "Afternoon" : "Night"}\n`
    text += `Staff: ${entry.staff_name}\n`
    
    if (isDisposalEntry(entry)) {
      text += `Reason: ${entry.reason}\n`
    }
    
    if (entry.notes) {
      text += `Notes: ${entry.notes}\n`
    }
    
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Entry details have been copied to your clipboard",
      })
    })
  }
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      if (type === "production") {
        await deleteProductionEntry(entry.id);
      } else {
        await deleteDisposalEntry(entry.id);
      }
      
      toast({
        title: "Success",
        description: `${type === "production" ? "Production" : "Disposal"} entry deleted successfully`,
      });
    } catch (error) {
      console.error(`Error deleting ${type} entry:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to delete ${type} entry`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {type === "production" ? (
                <BarChart3 className="h-4 w-4 text-primary" />
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
              {entry.product_name}
            </CardTitle>
            <CardDescription>
              {type === "production" ? "Production Entry" : "Disposal Entry"} • ID: {entry.id.substring(0, 8)}
            </CardDescription>
          </div>
          <Badge variant={type === "production" ? "default" : "destructive"}>
            {formatNumber(entry.quantity)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(entry.date), "PP")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="font-normal">
              {entry.shift === "morning" ? "Morning" : 
               entry.shift === "afternoon" ? "Afternoon" : "Night"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{entry.staff_name}</span>
          </div>
          
          {isDisposalEntry(entry) && (
            <div className="flex items-center gap-2 col-span-2">
              <InfoIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Reason:</span> {entry.reason}
            </div>
          )}
          
          {expanded && entry.notes && (
            <div className="flex gap-2 col-span-2 mt-2">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Notes:</span>
                <p className="text-muted-foreground mt-1">{entry.notes}</p>
              </div>
            </div>
          )}
          
          {expanded && (
            <div className="col-span-2 border-t mt-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-xs">
                  <span className="text-muted-foreground">Created at:</span>
                  <p>{format(new Date(entry.date), "PPP p")}</p>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Entry ID:</span>
                  <p className="font-mono">{entry.id}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={toggleExpand}>
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                More
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={copyToClipboard}>
            <ClipboardCopy className="h-4 w-4 mr-1" />
            Copy
          </Button>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete {type} entry
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this {type} entry for <strong>{entry.product_name}</strong>? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete Entry"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
} 