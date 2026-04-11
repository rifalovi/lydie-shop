import { HeroSection } from "@/components/shop/HeroSection";
import { ValueProps } from "@/components/shop/ValueProps";
import { CategoriesSection } from "@/components/shop/CategoriesSection";
import { FeaturedProducts } from "@/components/shop/FeaturedProducts";
import { Testimonials } from "@/components/shop/Testimonials";
import { Newsletter } from "@/components/shop/Newsletter";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ValueProps />
      <CategoriesSection />
      <FeaturedProducts />
      <Testimonials />
      <Newsletter />
    </>
  );
}
