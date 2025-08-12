import { SignedOut, SignedIn, SignInButton, UserButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { ChevronDown, FileText, GraduationCap, LayoutDashboard, PenBox, StarsIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  return (
    <header className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-50 supports-[background-filter]:bg-background/60">
      <nav className="container mx-auto  h-24 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="main-logo"
            width={96}
            height={96}
            className="h-24 w-auto object-contain"
          />
        </Link>

        {/* Right side navigation */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <SignedIn>
            <Link href="/dashboard">
              <Button variant="outline">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden md:block">Industry Insights</span>
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                <StarsIcon className="h-4 w-4" />
                <span className="hidden md:block">Growth Tools</span>
                <ChevronDown className="h-4 w-4 " />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>
                  <Link href={'/resume'} className="flex items-center gap-2" >
                    <FileText className="h-4 w-4" />
                    <span >Build Resume</span>
                  </Link>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href={'/ai-cover-letter'} className="flex items-center gap-2" >
                    <PenBox className="h-4 w-4" />
                    <span >Cover Letter</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href={'/interview'} className="flex items-center gap-2" >
                    <GraduationCap className="h-4 w-4" />
                    <span >Interview Prep</span>
                  </Link>
                </DropdownMenuItem>      
              </DropdownMenuContent>
            </DropdownMenu>

            <UserButton appearance={{
              elements:{
                avatarBox:'w-10 h-10',
                userButtonPopoverCard:"shadow-x1",
                userPreviewMainIdentifier:"font-semibold",
              },
            }}
            afterSignOutUrl="/"
            />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="outline">Sign Up</Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
          </SignedIn>
        </div>
      </nav>
    </header>
  );
};

export default Header;
