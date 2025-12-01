import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  // 1. Authenticate & Setup API Client
  const { topic, shop, session, admin, payload } = await authenticate.webhook(request);

  console.log("------------------------------------------------");
  console.log("🚀 WEBHOOK RECEIVED: " + topic);

  // 2. We need the "Graph ID" (looks like gid://shopify/Order/12345)
  // The payload usually gives just numbers, so we use the admin_graphql_api_id
  const orderId = payload.admin_graphql_api_id;
  console.log("🔍 Checking Fulfillment Orders for:", orderId);

  // 3. Ask Shopify for the Fulfillment Orders connected to this Order
  const response = await admin.graphql(
    `#graphql
      query getFulfillmentData($id: ID!) {
        order(id: $id) {
          fulfillmentOrders(first: 10) {
            nodes {
              id
              assignedLocation {
                name
                location {
                  id
                }
              }
              lineItems(first: 10) {
                nodes {
                  lineItem {
                    title
                  }
                }
              }
            }
          }
        }
      }
    `,
    { variables: { id: orderId } }
  );

  const { data } = await response.json();

  // 4. Log the results so we can see "Where" Shopify put the items
  const fulfillmentOrders = data.order.fulfillmentOrders.nodes;

  fulfillmentOrders.forEach((fo, index) => {
    console.log(`\n📦 Shipment #${index + 1} from: ${fo.assignedLocation.name}`);
    console.log(`   Location ID: ${fo.assignedLocation.location.id}`);
    fo.lineItems.nodes.forEach(item => {
      console.log(`   - ${item.lineItem.title}`);
    });
  });

  console.log("------------------------------------------------");

  return new Response();
};
