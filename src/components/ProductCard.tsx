import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Filter as FilterIcon } from "lucide-react";

interface ProductCardProps {
  id: number;
  title: string;
  price: number;
  stock_status: string;
  stock_quantity?: number | null;
  category?: string | null;
  tags?: string[];
  on_sale?: boolean;
}

export const ProductCard = ({ 
  id, 
  title, 
  price, 
  stock_status, 
  stock_quantity,
  category,
  tags,
  on_sale 
}: ProductCardProps) => {
  const isInStock = stock_status === 'instock';

  return (
    <Card className="group relative overflow-hidden border-border bg-gradient-to-br from-card to-secondary/30 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
      <div className="space-y-4">
        {/* Header with Product ID and Sale Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">ID: {id}</span>
          </div>
          {on_sale && (
            <Badge className="bg-accent text-accent-foreground font-semibold">
              On Sale
            </Badge>
          )}
        </div>

        {/* Product Title */}
        <h3 className="text-lg font-semibold text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Category */}
        {category && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <FilterIcon className="h-3 w-3" />
            {category}
          </p>
        )}

        {/* Price and Stock Status */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-2xl font-bold text-primary">
            ${parseFloat(price.toString()).toFixed(2)}
          </p>
          
          <Badge 
            variant={isInStock ? "default" : "secondary"}
            className={isInStock ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}
          >
            {isInStock ? "In Stock" : "Out of Stock"}
          </Badge>
        </div>

        {/* Stock Quantity */}
        {stock_quantity !== null && stock_quantity !== undefined && (
          <p className="text-sm text-muted-foreground">
            Available: <span className="font-semibold text-foreground">{stock_quantity}</span> units
          </p>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs bg-primary/10">
                +{tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </div>
      
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </Card>
  );
};