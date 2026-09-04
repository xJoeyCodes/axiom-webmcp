export const northstarCommercePublication = {
  source: "api" as const,
  mode: "merge" as const,
  provider: {
    name: "Northstar Commerce",
    domain: "northstar-commerce.example",
    canonicalUrl: "https://northstar-commerce.example",
    description:
      "Product discovery, cart management, and checkout capabilities.",
  },
  capabilities: [
    {
      name: "search_products",
      description: "Search the product catalog using a text query and filters.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string" }, category: { type: "string" } },
        required: ["query"],
      },
      outputSchema: {
        type: "object",
        properties: { products: { type: "array" } },
      },
      annotations: { readOnly: true },
      specVersion: "draft",
    },
    {
      name: "get_product",
      description:
        "Retrieve current product details, pricing, and availability.",
      inputSchema: {
        type: "object",
        properties: { productId: { type: "string" } },
        required: ["productId"],
      },
      outputSchema: { type: "object" },
      annotations: { readOnly: true },
      specVersion: "draft",
    },
    {
      name: "add_to_cart",
      description: "Add a product and quantity to the active shopping cart.",
      inputSchema: {
        type: "object",
        properties: {
          productId: { type: "string" },
          quantity: { type: "integer", minimum: 1 },
        },
        required: ["productId", "quantity"],
      },
      outputSchema: { type: "object" },
      annotations: { readOnly: false, sideEffecting: true, destructive: false },
      specVersion: "draft",
    },
    {
      name: "checkout",
      description:
        "Create an order from the active cart after user confirmation.",
      inputSchema: {
        type: "object",
        properties: { cartId: { type: "string" } },
        required: ["cartId"],
      },
      outputSchema: { type: "object" },
      annotations: {
        readOnly: false,
        sideEffecting: true,
        requiresConfirmation: true,
      },
      specVersion: "draft",
    },
  ],
};
