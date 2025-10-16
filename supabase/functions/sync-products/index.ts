import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WooCommerceProduct {
  id: number;
  name: string;
  price: string;
  stock_status: string;
  stock_quantity: number | null;
  categories: Array<{ name: string }>;
  tags: Array<{ name: string }>;
  on_sale: boolean;
  date_created: string;
  average_rating: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting WooCommerce product sync...');

    // WooCommerce credentials
    const baseUrl = 'https://wp-multisite.convertcart.com';
    const consumerKey = 'ck_af82ae325fbee1c13f31eb26148f4dea473b0f77';
    const consumerSecret = 'cs_2d8cc467c5b91a80f5ed18dd3c282ee8299c9445';

    // Fetch products from WooCommerce
    const wooUrl = `${baseUrl}/wp-json/wc/v3/products?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}&per_page=100`;
    
    console.log('Fetching from WooCommerce API...');
    const response = await fetch(wooUrl);
    
    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
    }

    const products: WooCommerceProduct[] = await response.json();
    console.log(`Fetched ${products.length} products from WooCommerce`);

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prepare products for insertion
    const productsToSync = products.map((p) => ({
      id: p.id,
      title: p.name,
      price: parseFloat(p.price) || 0,
      stock_status: p.stock_status,
      stock_quantity: p.stock_quantity ?? 0,
      category: p.categories && p.categories.length > 0 ? p.categories[0].name : null,
      tags: p.tags && p.tags.length > 0 ? p.tags.map(t => t.name) : [],
      on_sale: Boolean(p.on_sale),
      date_created: p.date_created,
    }));

    // Upsert products (insert or update if exists)
    const { data, error } = await supabase
      .from('products')
      .upsert(productsToSync, { onConflict: 'id' });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log(`Successfully synced ${productsToSync.length} products`);

    return new Response(
      JSON.stringify({
        success: true,
        synced: productsToSync.length,
        products: productsToSync,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});