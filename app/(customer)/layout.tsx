import { CartProvider } from "@/lib/cart";
import { LangProvider } from "@/lib/i18n";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <CartProvider>
        <div className="mx-auto min-h-screen max-w-md bg-cream shadow-xl">{children}</div>
      </CartProvider>
    </LangProvider>
  );
}
