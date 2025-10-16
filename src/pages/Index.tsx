import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { SegmentEditor } from "@/components/SegmentEditor";
import { Card } from "@/components/ui/card";
import { RefreshCw, Package, Filter as FilterIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: number;
  title: string;
  price: number;
  stock_status: string;
  stock_quantity?: number | null;
  category?: string | null;
  tags?: string[];
  on_sale?: boolean;
}

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('get-products');

      if (error) throw error;

      if (data.success) {
        setProducts(data.products);
        setFilteredProducts(data.products);
        toast.success(`Loaded ${data.count} products`);
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error(error.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      toast.loading("Syncing products from WooCommerce...", { id: "sync" });

      const { data, error } = await supabase.functions.invoke('sync-products');

      if (error) throw error;

      if (data.success) {
        toast.success(`Synced ${data.synced} products successfully!`, { id: "sync" });
        await fetchProducts();
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(error.message || 'Failed to sync products', { id: "sync" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEvaluate = async (conditions: string) => {
    try {
      setIsEvaluating(true);
      toast.loading("Evaluating conditions...", { id: "evaluate" });

      const { data, error } = await supabase.functions.invoke('evaluate-segments', {
        body: { conditions },
      });

      if (error) throw error;

      if (data.success) {
        setFilteredProducts(data.products);
        setIsFiltered(true);
        toast.success(`Found ${data.matched} matching products`, { id: "evaluate" });
      }
    } catch (error: any) {
      console.error('Evaluation error:', error);
      toast.error(error.message || 'Failed to evaluate conditions', { id: "evaluate" });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleResetFilter = () => {
    setFilteredProducts(products);
    setIsFiltered(false);
    toast.success("Filter reset");
  };

  const displayProducts = isFiltered ? filteredProducts : products;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  WooCommerce
                </h1>
                <p className="text-sm text-muted-foreground">
                  Advanced product segmentation system
                </p>
              </div>
            </div>
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              className="gap-2 bg-primary hover:bg-primary-hover"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Products"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Segment Editor */}
        <section>
          <SegmentEditor onEvaluate={handleEvaluate} isEvaluating={isEvaluating} />
        </section>

        {/* Products Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-foreground">
                {isFiltered ? "Filtered Products" : "All Products"}
              </h2>
              {isFiltered && (
                <Button
                  onClick={handleResetFilter}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <FilterIcon className="h-4 w-4" />
                  Clear Filter
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{displayProducts.length}</span> products
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : displayProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  title={product.title}
                  price={product.price}
                  stock_status={product.stock_status}
                  stock_quantity={product.stock_quantity}
                  category={product.category}
                  tags={product.tags}
                  on_sale={product.on_sale}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center bg-gradient-to-br from-card to-secondary/20">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
              <p className="text-muted-foreground mb-4">
                {isFiltered
                  ? "No products match your filter conditions"
                  : "Click 'Sync Products' to import products from WooCommerce"}
              </p>
              {!isFiltered && (
                <Button onClick={handleSync} disabled={isSyncing} className="gap-2">
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                  Sync Products Now
                </Button>
              )}
            </Card>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>WooCommerce Product Filter System</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;