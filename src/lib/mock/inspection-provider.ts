import type { Provider } from "@/lib/types/axiom";

export const mockInspectionProvider: Provider = {
  id: "provider_northstar_commerce",
  slug: "northstar-commerce",
  name: "Northstar Commerce",
  domain: "northstar.example",
  description:
    "Product discovery, cart management, and checkout capabilities for a modern commerce storefront.",
  verified: true,
  verificationStatus: "verified",
  lastIndexed: "2026-09-03T10:30:00.000Z",
  metadata: {
    industry: "Commerce",
    location: "Global",
    documentationUrl: "https://example.com",
  },
  capabilities: [
    {
      id: "cap_northstar_search_products",
      name: "search_products",
      description:
        "Find products by query, category, availability, and result limit.",
      inputs: [
        {
          name: "query",
          description: "Natural-language product search query.",
          required: true,
          schema: { type: "string", examples: ["trail running shoes"] },
        },
        {
          name: "category",
          description: "Optional catalog category identifier.",
          required: false,
          schema: { type: "string" },
        },
        {
          name: "limit",
          description: "Maximum number of products to return.",
          required: false,
          schema: { type: "integer", default: 12 },
        },
      ],
      output: {
        description: "Products matching the requested catalog constraints.",
        schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              product_id: { type: "string" },
              name: { type: "string" },
              price: { type: "number" },
              currency: { type: "string" },
              available: { type: "boolean" },
            },
            required: ["product_id", "name", "price", "currency"],
          },
        },
      },
      metadata: {
        version: "1.0.0",
        category: "discovery",
        tags: ["commerce", "product", "catalog", "search", "find"],
        transport: "webmcp",
        destructive: false,
        requiresConfirmation: false,
      },
    },
    {
      id: "cap_northstar_get_product",
      name: "get_product",
      description:
        "Retrieve current product information, variants, price, and availability.",
      inputs: [
        {
          name: "product_id",
          description: "Northstar catalog product identifier.",
          required: true,
          schema: { type: "string" },
        },
      ],
      output: {
        description: "Detailed product record.",
        schema: {
          type: "object",
          properties: {
            product_id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            currency: { type: "string" },
            variants: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  variant_id: { type: "string" },
                  label: { type: "string" },
                  available: { type: "boolean" },
                },
                required: ["variant_id", "label", "available"],
              },
            },
          },
          required: ["product_id", "name", "price", "currency"],
        },
      },
      metadata: {
        version: "1.0.0",
        category: "retrieval",
        tags: ["commerce", "product", "catalog", "details"],
        transport: "webmcp",
        destructive: false,
        requiresConfirmation: false,
      },
    },
    {
      id: "cap_northstar_add_to_cart",
      name: "add_to_cart",
      description:
        "Add a selected product variant and quantity to a shopping cart.",
      inputs: [
        {
          name: "product_id",
          description: "Northstar catalog product identifier.",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "variant_id",
          description: "Selected product variant identifier.",
          required: false,
          schema: { type: "string" },
        },
        {
          name: "quantity",
          description: "Number of units to add.",
          required: true,
          schema: { type: "integer", default: 1 },
        },
        {
          name: "cart_id",
          description: "Existing cart identifier, when available.",
          required: false,
          schema: { type: "string" },
        },
      ],
      output: {
        description: "Updated shopping cart summary.",
        schema: {
          type: "object",
          properties: {
            cart_id: { type: "string" },
            item_count: { type: "integer" },
            subtotal: { type: "number" },
            currency: { type: "string" },
          },
          required: ["cart_id", "item_count", "subtotal", "currency"],
        },
      },
      metadata: {
        version: "1.1.0",
        category: "transaction",
        tags: ["commerce", "cart", "product", "add"],
        transport: "webmcp",
        destructive: true,
        requiresConfirmation: false,
      },
    },
    {
      id: "cap_northstar_checkout",
      name: "checkout",
      description:
        "Create an order from a reviewed cart and confirmed delivery details.",
      inputs: [
        {
          name: "cart_id",
          description: "Reviewed Northstar cart identifier.",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "shipping_address",
          description: "Confirmed destination for the order.",
          required: true,
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              line_1: { type: "string" },
              city: { type: "string" },
              postal_code: { type: "string" },
              country: { type: "string" },
            },
            required: ["name", "line_1", "city", "country"],
          },
        },
      ],
      output: {
        description: "Confirmed order record.",
        schema: {
          type: "object",
          properties: {
            order_id: { type: "string" },
            status: { type: "string", enum: ["confirmed"] },
            total: { type: "number" },
            currency: { type: "string" },
          },
          required: ["order_id", "status", "total", "currency"],
        },
      },
      metadata: {
        version: "1.0.0",
        category: "transaction",
        tags: ["commerce", "checkout", "order", "purchase"],
        transport: "webmcp",
        destructive: true,
        requiresConfirmation: true,
      },
    },
  ],
};
