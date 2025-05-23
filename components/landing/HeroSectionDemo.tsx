"use client"

import { HeroSection } from "@/components/ui/hero-section"
import { Icons } from "@/components/ui/icons"

export function HeroSectionDemo() {
  return (
    <HeroSection
      badge={{
        text: "Explore our new components", 
        action: {
          text: "Learn more",
          href: "/docs", 
        },
      }}
      title="Build Directory Listings Faster" 
      description="Premium UI components and directory-focused features built with React and Tailwind CSS. Save time and ship your next project faster."
      actions={[
        {
          text: "Browse Listings", 
          href: "/listings", 
          variant: "default",
        },
        {
          text: "GitHub",
          href: "https://github.com/mikaelాలను/alpha",
          variant: "glow",
          icon: <Icons.gitHub className="h-5 w-5" />,
        },
      ]}
      image={{
        light: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop",
        dark: "https://images.unsplash.com/photo-1522708323590-d24DBb6b0267?q=80&w=2070&auto=format&fit=crop",
        alt: "Modern House Listings Preview",
      }}
    />
  )
}
