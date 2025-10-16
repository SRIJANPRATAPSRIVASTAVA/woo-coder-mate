# WooCommerce Product Segmentation Tool

A powerful web application for syncing WooCommerce products and creating dynamic product segments using custom filter conditions. Built with React, TypeScript, and Supabase.

## Live Demos

- **Frontend**: [https://woo-coder-mate-main.vercel.app/](https://woo-coder-mate-main.vercel.app/)
- **API Documentation**: See `https://woo-coder-mate-main.vercel.app/api-docs` for full OpenAPI specification

## Features

- **Product Sync**: Automatically sync products from WooCommerce to database
- **Smart Segmentation**: Filter products using intuitive condition syntax
- **Responsive UI**: Beautiful, modern interface built with shadcn/ui
- **Backend APIs**: RESTful Edge Functions with comprehensive error handling

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **Database**: PostgreSQL with Row Level Security
- **State Management**: TanStack Query

## Prerequisites

- Node.js 18+ and npm
- WooCommerce store with API access (for product sync)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/SRIJANPRATAPSRIVASTAVA/woo-coder-mate.git
cd woo-coder-mate
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

If running locally, ensure these variables are set:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Test inputs
```bash
cd src/__tests__
node validation.test.js
```

The application will be available at `http://localhost:8080`

## Database Schema

### Products Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Unique product ID from WooCommerce |
| `title` | text | Product name |
| `price` | numeric | Product price (defaults to 0 if null) |
| `stock_status` | text | Stock status (instock, outofstock, onbackorder) |
| `stock_quantity` | integer | Quantity in stock (defaults to 0 if null) |
| `category` | text | Primary product category |
| `tags` | array | Product tags |
| `on_sale` | boolean | Sale status (defaults to false) |
| `date_created` | timestamp | WooCommerce creation date |
| `created_at` | timestamp | Database creation timestamp |
| `synced_at` | timestamp | Last sync timestamp |

## Product Ingestion Logic

### Sync Process

1. **Fetch from WooCommerce**: The `/sync-products` endpoint fetches products from a WooCommerce API
2. **Data Transformation**: Raw WooCommerce data is transformed into a clean schema:
   - `price` is parsed as float, defaults to 0 if null/invalid
   - `stock_quantity` defaults to 0 if null
   - `on_sale` is explicitly cast to boolean
   - First category is extracted from categories array
3. **Upsert to Database**: Products are inserted or updated using `id` as conflict target
4. **Automatic Timestamps**: `synced_at` is automatically updated via database trigger

### Data Validation Rules

- **Price**: Must be numeric, non-null (defaults to 0)
- **Stock Quantity**: Must be numeric, non-null (defaults to 0)
- **On Sale**: Must be boolean (true/false)
- **Stock Status**: Validated against allowed values (instock, outofstock, onbackorder)
- **Category**: Nullable, accepts text
- **Tags**: Array of strings

## Segmentation Usage

### Creating Segments

Use the Segment Editor to define filter conditions with the following syntax:

```
* field operator value
* One condition per line
```

### Sample Input for Segmentation

```
price > 50
category = Jackets
stock_status = instock
stock_quantity >= 0
on_sale = true
title = Assumenda.
```

### Supported Fields

| Field | Type | Operators | Example |
|-------|------|-----------|---------|
| `title` | string | =, != | `title = Assumenda.` |
| `price` | number | =, !=, >, <, >=, <= | `price > 100` |
| `category` | string | =, != | `category = Accessories` |
| `stock_status` | string | =, != | `stock_status = instock` |
| `stock_quantity` | number | =, !=, >, <, >=, <= | `stock_quantity >= 5` |
| `on_sale` | boolean | =, != | `on_sale = true` |

### Validation Features

- **Format Validation**: Ensures proper `field operator value` structure
- **Field Validation**: Checks against allowed field names
- **Operator Validation**: Validates operator compatibility with field types
- **Type Validation**: Ensures numeric fields receive numbers, booleans receive true/false
- **Smart Suggestions**: Detects common mistakes (missing newlines, invalid values)
- **Real-time Feedback**: Inline error messages with line numbers

## API Endpoints

### 1. Sync Products from WooCommerce

```http
POST /sync-products
```

**Response:**
```json
{
  "success": true,
  "synced": 42,
  "products": [...]
}
```

### 2. Get All Products

```http
GET /get-products
```

**Response:**
```json
{
  "success": true,
  "count": 42,
  "products": [...]
}
```

### 3. Evaluate Product Segments

```http
POST /evaluate-segments
Content-Type: application/json

{
  "conditions": "price > 100\nstock_status = instock"
}
```

**Response:**
```json
{
  "success": true,
  "conditions": [...],
  "matched": 15,
  "products": [...]
}
```

Full API documentation available in `https://woo-coder-mate-main.vercel.app/api-docs`

## Project Structure

```
.
├── public/
│   └── api-docs.yaml                # Open-API docs
├── src/
│   ├── components/
│   │   ├── ProductCard.tsx          # Product display component
│   │   ├── SegmentEditor.tsx        # Condition editor with validation
│   │   └── ui/                      # shadcn/ui components
│   ├── pages/
│   │   └── Index.tsx                # Main application page
│   ├── integrations/
│   │   └── supabase/                # Auto-generated Supabase client
│   └── main.tsx                     # Application entry point
├── supabase/
│   ├── functions/
│   │   ├── sync-products/           # WooCommerce sync endpoint
│   │   ├── get-products/            # Product retrieval endpoint
│   │   ├── evaluate-segments/       # Segment evaluation endpoint
│   └── config.toml                  # Supabase configuration
└── README.md
```

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: ESLint + Prettier
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS with design tokens

## Deployment

### Manual Deployment

The project can be deployed to any static hosting service:

```bash
npm run build
# Deploy the `dist` folder
```

## Security

- **Row Level Security (RLS)**: Enabled on products table
- **Public Read Access**: Products are readable by all users
- **Service Role Access**: Admin operations require service role key
- **Input Validation**: All user inputs are validated before processing
- **CORS**: Properly configured for web access
