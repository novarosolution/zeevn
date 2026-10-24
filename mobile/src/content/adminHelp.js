/** Fixed shop manual. Customer questions stay on FAQs. Every step opens an existing screen. */

export const ADMIN_HELP = {
  title: "How to run the shop",
  subtitle: "Each step opens that screen.",
  sections: [
    {
      key: "daily",
      title: "Daily routine",
      intro: "A normal day in five steps.",
      steps: [
        {
          title: "Open the desk",
          body: "See whether the shop is taking orders, then the queue: unpaid, new, packing, ready, on the route.",
          route: "AdminShopDesk",
        },
        {
          title: "Book jars in",
          body: "When a delivery arrives, add the lines and confirm. Stock goes up only when the receipt is confirmed.",
          route: "AdminStockIn",
        },
        {
          title: "Set today’s prices",
          body: "The customer pays price. MRP is shown struck through only when it is above that price.",
          route: "AdminPrices",
        },
        {
          title: "Watch orders",
          body: "Pack, then mark ready. Step in when a row has been waiting on a rider.",
          route: "AdminOrders",
        },
        {
          title: "Close the day",
          body: "Mark the cash you actually collected, then count the jars. The count is a snapshot.",
          route: "AdminCash",
          also: { label: "Then closing", route: "AdminClosing" },
        },
        {
          title: "Tip",
          body: "Tiles on Overview are the things that need you today.",
          route: "AdminDashboard",
        },
      ],
    },
    {
      key: "orders",
      title: "Orders",
      intro: "One shop. Status moves pending, confirmed, preparing, ready for pickup, out for delivery, delivered. Paid orders continue at preparing. Shipped is treated as delivered. Cancelled is final.",
      steps: [
        {
          title: "Find an order",
          body: "Search, today’s range from midnight in Asia/Kolkata, zone, rider, payment.",
          route: "AdminOrders",
        },
        {
          title: "Change the status",
          body: "Open the order.",
          route: "AdminOrders",
        },
        {
          title: "Nobody has taken it",
          body: "Shows Waiting, Silent, Accepted, Declined, and No rider. Assigning stays on the order.",
          route: "AdminDispatch",
        },
        {
          title: "Returns",
          body: "Only a delivered order. Approving tells you to send the money yourself. Cash on Delivery that is still pending is not a payout.",
          route: "AdminReturns",
        },
        {
          title: "Shop desk",
          body: "The two switches are accepting orders and the weekly schedule. The seven rows of hours are edited on Settings.",
          route: "AdminShopDesk",
          also: { label: "Edit hours", route: "AdminSettings" },
        },
      ],
    },
    {
      key: "riders",
      title: "Riders",
      intro: "A rider is a user with delivery partner turned on.",
      steps: [
        {
          title: "Turn a rider on",
          body: "Turning one off is on Riders, and orders already assigned to them stay assigned.",
          route: "AdminUsers",
          also: { label: "Riders", route: "AdminRiders" },
        },
        {
          title: "Where they are",
          body: "Watch only. A real location in the last 15 minutes is online. The phone opens the device maps. The outline of a zone is drawn on the web admin.",
          route: "AdminRiderMap",
        },
        {
          title: "Cash they collected",
          body: "A row is a delivered Cash on Delivery order whose payment is still pending. Mark collected sets that payment to paid. There is no bank-deposit step.",
          route: "AdminCash",
        },
        {
          title: "Send a message",
          body: "One message goes to every rider.",
          route: "AdminRiderMessages",
        },
        {
          title: "How they did",
          body: "Today starts at midnight in Asia/Kolkata.",
          route: "AdminRiderPerformance",
        },
      ],
    },
    {
      key: "products",
      title: "Products and prices",
      intro: "One jar, one stock count. Size options are a label and a price.",
      steps: [
        {
          title: "The five lines",
          body: "Ghee, Tel, Masala, Honey, Gifts.",
          route: "AdminCategories",
        },
        {
          title: "Add a jar",
          body: "Category starts as General, unit as “1 pc”, ETA as “10 MINS”.",
          route: "AdminAddProduct",
        },
        {
          title: "Change a price",
          body: "Whole rupees. An order already placed keeps the price it was placed at.",
          route: "AdminPrices",
        },
        {
          title: "Publish and the shop card",
          body: "Draft, Coming soon, Out, Low, In stock.",
          route: "AdminProducts",
        },
      ],
    },
    {
      key: "stock",
      title: "Stock",
      intro: "One integer per product. Low is in stock with a count from 1 to 5. Out is not for sale, or a count under 1. Coming soon is a teaser, not a stock state.",
      steps: [
        {
          title: "Change a count",
          body: "A count above 0 is for sale. Setting 0 takes it off sale. Switching it off keeps the count.",
          route: "AdminInventory",
        },
        {
          title: "A delivery of jars",
          body: "The same jar cannot be on the receipt twice. Confirming locks it.",
          route: "AdminStockIn",
        },
        {
          title: "What to order next",
          body: "This suggests a quantity. Stock does not change until a stock-in receipt is confirmed.",
          route: "AdminReorders",
        },
        {
          title: "Count the shelf",
          body: "One closing per date in Asia/Kolkata. Submit only when every line is counted. The snapshot does not change the count on the product.",
          route: "AdminClosing",
        },
        {
          title: "Sold and remaining",
          body: "",
          route: "AdminStockReport",
        },
        {
          title: "Who changed a count",
          body: "",
          route: "AdminStockHistory",
        },
      ],
    },
    {
      key: "delivery",
      title: "Delivery area",
      intro: "One farm shop.",
      steps: [
        {
          title: "The area",
          body: "A zone needs a name, its own 6-digit PINs, and an outline of at least 3 points. Delivery fee and free-above live here. The customer’s ETA is the distance times the minutes per kilometre.",
          route: "AdminDelivery",
        },
        {
          title: "Hours, minimum, and payment",
          body: "Keep at least one of Cash on Delivery or online payment on. The header shows Open or Closed from the same check the checkout uses.",
          route: "AdminSettings",
        },
      ],
    },
    {
      key: "storefront",
      title: "What customers see",
      intro: "",
      steps: [
        {
          title: "The home page",
          body: "Hero, festival, and the shop pin. Product prices stay on Products.",
          route: "AdminHomeView",
        },
        {
          title: "Rows on the home page",
          body: "Prime Products first, then the other section names.",
          route: "AdminHomeSections",
        },
        {
          title: "A discount at checkout",
          body: "Off means the coupon is inactive. Used count is never reset.",
          route: "AdminCoupons",
        },
        {
          title: "Points",
          body: "Redeeming spends points and issues a hidden one-use coupon.",
          route: "AdminRewards",
        },
        {
          title: "A message to every customer",
          body: "",
          route: "AdminNotifications",
        },
        {
          title: "Questions on the Help screen",
          body: "",
          route: "AdminFaqs",
        },
        {
          title: "A customer",
          body: "",
          route: "AdminCustomers",
        },
        {
          title: "Closing an account",
          body: "",
          route: "AdminDeletions",
        },
      ],
    },
    {
      key: "people",
      title: "People",
      intro: "",
      steps: [
        {
          title: "Admins and riders",
          body: "The two switches are admin and delivery partner. You cannot turn your own admin access off.",
          route: "AdminUsers",
        },
        {
          title: "A customer wrote in",
          body: "One thread per customer. Reply does not close the thread.",
          route: "AdminSupport",
        },
      ],
    },
    {
      key: "health",
      title: "Settings and health",
      intro: "",
      steps: [
        {
          title: "The shop switches",
          body: "",
          route: "AdminSettings",
        },
        {
          title: "Is the shop up",
          body: "This checks the API, the database, live updates, and whether checkout is open. It does not restart anything.",
          route: "AdminHealth",
        },
        {
          title: "Who changed what",
          body: "Rows start from the moment the log exists.",
          route: "AdminLogs",
        },
      ],
    },
  ],
};
