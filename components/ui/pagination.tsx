import * as React from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Pagination({ 
  className, 
  ...props 
}: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row flex-wrap items-center justify-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ 
  className,
  ...props 
}: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" className={cn("flex", className)} {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        isActive ? "purple-accent" : "",
        className
      )}
      {...props}
    />
  )
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 px-2 md:px-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon className="h-4 w-4" />
      <span className="hidden xs:inline-block">Предыдущая</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 px-2 md:px-2.5", className)}
      {...props}
    >
      <span className="hidden xs:inline-block">Следующая</span>
      <ChevronRightIcon className="h-4 w-4" />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="h-4 w-4" />
      <span className="sr-only">Больше страниц</span>
    </span>
  )
}

// New component to create a pagination with ellipsis
interface SmartPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  maxDisplayedPages?: number;
}

function SmartPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  maxDisplayedPages = 5
}: SmartPaginationProps) {
  // Create array of pages to display with ellipsis
  const getVisiblePages = React.useCallback(() => {
    // Always show first and last page
    if (totalPages <= maxDisplayedPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const sidePages = Math.floor((maxDisplayedPages - 3) / 2);
    const leftSide = Math.max(2, currentPage - sidePages);
    const rightSide = Math.min(totalPages - 1, currentPage + sidePages);
    
    const visiblePages = [1];
    
    if (leftSide > 2) {
      visiblePages.push(-1); // Left ellipsis
    }
    
    for (let i = leftSide; i <= rightSide; i++) {
      visiblePages.push(i);
    }
    
    if (rightSide < totalPages - 1) {
      visiblePages.push(-2); // Right ellipsis
    }
    
    visiblePages.push(totalPages);
    
    return visiblePages;
  }, [currentPage, totalPages, maxDisplayedPages]);

  const visiblePages = getVisiblePages();

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            style={{ cursor: 'pointer' }}
            tabIndex={0}
          />
        </PaginationItem>
        
        {visiblePages.map((page, index) => (
          page < 0 ? (
            <PaginationItem key={`ellipsis-${page}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                isActive={page === currentPage}
                onClick={() => onPageChange(page)}
                style={{ cursor: 'pointer' }}
                tabIndex={0}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        ))}
        
        <PaginationItem>
          <PaginationNext 
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            style={{ cursor: 'pointer' }}
            tabIndex={0}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  SmartPagination, // Export the new smart pagination component
}