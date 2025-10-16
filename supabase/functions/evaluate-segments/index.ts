import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Product {
  id: number;
  title: string;
  price: number;
  stock_status: string;
  stock_quantity: number | null;
  category: string | null;
  tags: string[];
  on_sale: boolean;
  date_created: string | null;
}

// Parse a single condition line (e.g., "price > 1000")
function parseCondition(line: string): { field: string; operator: string; value: string } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
    return null; // Skip empty lines and comments
  }

  // Match operators: >=, <=, !=, =, >, <
  const match = trimmed.match(/^(\w+)\s*(>=|<=|!=|=|>|<)\s*(.+)$/);
  if (!match) {
    throw new Error(`Invalid condition format: "${trimmed}"`);
  }

  return {
    field: match[1].toLowerCase(),
    operator: match[2],
    value: match[3].trim(),
  };
}

// Evaluate a single condition against a product
function evaluateCondition(product: Product, condition: { field: string; operator: string; value: string }): boolean {
  const { field, operator, value } = condition;

  // Get the product field value
  let productValue: any;
  if (field === 'id') productValue = product.id;
  else if (field === 'title') productValue = product.title.toLowerCase();
  else if (field === 'price') productValue = parseFloat(product.price.toString());
  else if (field === 'stock_status') productValue = product.stock_status.toLowerCase();
  else if (field === 'stock_quantity') productValue = product.stock_quantity;
  else if (field === 'category') productValue = product.category ? product.category.toLowerCase() : '';
  else if (field === 'on_sale') productValue = product.on_sale;
  else if (field === 'tags') {
    // For tags, check if any tag matches
    productValue = product.tags ? product.tags.map(t => t.toLowerCase()) : [];
  }
  else {
    throw new Error(`Unknown field: "${field}"`);
  }

  // Parse the condition value
  let conditionValue: any = value;
  if (field === 'price' || field === 'id' || field === 'stock_quantity') {
    conditionValue = parseFloat(value);
    if (isNaN(conditionValue)) {
      throw new Error(`Invalid numeric value for ${field}: "${value}"`);
    }
  } else if (field === 'on_sale') {
    conditionValue = value.toLowerCase() === 'true';
  } else if (field === 'tags') {
    conditionValue = value.toLowerCase().replace(/['"]/g, '');
  } else {
    conditionValue = value.toLowerCase().replace(/['"]/g, ''); // Remove quotes
  }

  // Evaluate based on operator
  // Special handling for tags (array field)
  if (field === 'tags') {
    if (operator === '=') {
      return productValue.includes(conditionValue);
    } else if (operator === '!=') {
      return !productValue.includes(conditionValue);
    }
    throw new Error(`Operator "${operator}" not supported for tags field`);
  }

  switch (operator) {
    case '=':
      return productValue === conditionValue;
    case '!=':
      return productValue !== conditionValue;
    case '>':
      return productValue > conditionValue;
    case '<':
      return productValue < conditionValue;
    case '>=':
      return productValue >= conditionValue;
    case '<=':
      return productValue <= conditionValue;
    default:
      throw new Error(`Unknown operator: "${operator}"`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Evaluating segment conditions...');

    const { conditions } = await req.json();

    if (!conditions || typeof conditions !== 'string') {
      throw new Error('Missing or invalid "conditions" field. Expected a string with one condition per line.');
    }

    // Parse conditions
    const lines = conditions.split('\n');
    const parsedConditions = lines
      .map(parseCondition)
      .filter((c) => c !== null) as { field: string; operator: string; value: string }[];

    console.log(`Parsed ${parsedConditions.length} conditions`);

    if (parsedConditions.length === 0) {
      throw new Error('No valid conditions found');
    }

    // Fetch all products
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: products, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log(`Evaluating ${products?.length || 0} products against conditions`);

    // Filter products that match ALL conditions
    const filteredProducts = (products || []).filter((product: Product) => {
      return parsedConditions.every((condition) => {
        try {
          return evaluateCondition(product, condition);
        } catch (error) {
          console.error(`Error evaluating condition for product ${product.id}:`, error);
          return false;
        }
      });
    });

    console.log(`${filteredProducts.length} products matched the conditions`);

    return new Response(
      JSON.stringify({
        success: true,
        conditions: parsedConditions,
        matched: filteredProducts.length,
        products: filteredProducts,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Evaluation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});