import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PartnerLogo } from '@prisma/client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'; // Import Shadcn Carousel components
import Autoplay from 'embla-carousel-autoplay'; // For autoplay functionality

interface PartnerCarouselProps {
  logos: PartnerLogo[];
  isEnabled: boolean;
  title?: string | null;
}

const PartnerCarousel: React.FC<PartnerCarouselProps> = ({ logos, isEnabled, title }) => {
  if (!isEnabled || !logos || logos.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        {title && (
          <h2 className="text-3xl font-bold text-center mb-8 md:mb-10 text-text-primary font-raleway tracking-tight">
            {title}
          </h2>
        )}
        <Carousel
          opts={{
            align: 'start',
            loop: true,
            slidesToScroll: 1,
          }}
          plugins={[
            Autoplay({
              delay: 3000,
              stopOnInteraction: true,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {logos.map((logo) => (
              <CarouselItem key={logo.id} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 flex justify-center">
                <div className="p-2 flex items-center justify-center h-24 w-full">
                  {logo.imageUrl ? (
                    logo.linkUrl ? (
                      <Link href={logo.linkUrl} passHref legacyBehavior>
                        <a target="_blank" rel="noopener noreferrer" className="block h-full w-auto hover:opacity-80 transition-opacity">
                          <Image 
                            src={logo.imageUrl} 
                            alt={logo.name || 'Partner Logo'} 
                            width={150} 
                            height={60} 
                            className="object-contain h-full w-auto max-h-16"
                          />
                        </a>
                      </Link>
                    ) : (
                      <div className="block h-full w-auto">
                        <Image 
                          src={logo.imageUrl} 
                          alt={logo.name || 'Partner Logo'} 
                          width={150} 
                          height={60} 
                          className="object-contain h-full w-auto max-h-16"
                        />
                      </div>
                    )
                  ) : (
                    <div className="w-full h-16 bg-muted rounded flex items-center justify-center text-muted-foreground">
                      {logo.name || 'Logo'}
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {logos.length > 5 && (
            <>
              <CarouselPrevious className="absolute left-[-15px] md:left-[-25px] top-1/2 -translate-y-1/2 text-primary hover:text-primary-focus disabled:opacity-50" />
              <CarouselNext className="absolute right-[-15px] md:right-[-25px] top-1/2 -translate-y-1/2 text-primary hover:text-primary-focus disabled:opacity-50" />
            </>
          )}
        </Carousel>
      </div>
    </section>
  );
};

export default PartnerCarousel;
